import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import HOD_API from "../../apis/HOD";
import CourseForm from "./CourseSetup/CourseForm";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
  FiUsers,
  FiFilter,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiChevronRight,
  FiGrid,
} from "react-icons/fi";

const CourseManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [courses, setCourses] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSemesterType, setSelectedSemesterType] = useState("");

  useEffect(() => {
    if (location.state?.openCourseForm || location.state?.courseDraft) {
      setEditCourse(location.state?.courseDraft || null);
      setOpenForm(true);
      navigate(location.pathname, { replace: true });
    }
    if (user) loadCourses();
  }, [user]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await HOD_API.courses.getAll(user?.token);
      setCourses(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.log("Error loading courses", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = () => {
    setEditCourse(null);
    setOpenForm(true);
  };

  const handleEdit = (course) => {
    setEditCourse(course);
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await HOD_API.courses.deleteCourse(id, user?.token);
      loadCourses();
    } catch {
      alert("Error deleting course");
    }
  };

  const handleCourseSaved = () => {
    setOpenForm(false);
    loadCourses();
  };

  // Filter and sort courses
  const filteredCourses = courses.filter((course) => {
    const matchSearch =
      course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSemester = selectedSemester
      ? String(course.semester) === selectedSemester
      : true;

    const matchSemesterType = selectedSemesterType
      ? (selectedSemesterType === "even" && course.semester % 2 === 0) ||
        (selectedSemesterType === "odd" && course.semester % 2 === 1)
      : true;

    return matchSearch && matchSemester && matchSemesterType;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    // Active courses first, then inactive
    if (a.isActive !== b.isActive) {
      return a.isActive ? -1 : 1;
    }
    // Within same status, sort by semester ascending
    return (a.semester || 0) - (b.semester || 0);
  });

  const actionButtons = [
    {
      id: "edit",
      icon: <FiEdit2 className="w-5 h-5" />,
      label: "Edit",
      color: "text-blue-600 hover:text-blue-700 hover:bg-blue-50",
      action: handleEdit,
    },
    {
      id: "clos",
      icon: <FiBookOpen className="w-5 h-5" />,
      label: "CLOs",
      color: "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50",
      action: (c) => navigate(`/hod/courses/${c.id}/clos`),
    },
    {
      id: "faculty",
      icon: <FiUsers className="w-5 h-5" />,
      label: "Faculty",
      color: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
      action: (c) => navigate(`/hod/courses/${c.id}/assign-faculty`),
    },
    {
      id: "delete",
      icon: <FiTrash2 className="w-5 h-5" />,
      label: "Delete",
      color: "text-red-600 hover:text-red-700 hover:bg-red-50",
      action: (c) => handleDelete(c.id),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm">
                <FiGrid className="w-8 h-8 text-gray-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Course Management
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Manage curriculum and course offerings across all semesters
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleAddCourse}
            className="flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-base shadow-sm transition-colors"
          >
            <FiPlus className="w-6 h-6" />
            Add New Course
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SEARCH */}
          <div className="lg:col-span-2">
            <label className="block text-base font-medium text-gray-700 mb-3">
              Search Courses
            </label>
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by course code, name, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              />
            </div>
          </div>

          {/* FILTERS INLINE */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-base font-medium text-gray-700 mb-3">
                Semester
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-base font-medium text-gray-700 mb-3">
                Type
              </label>
              <select
                value={selectedSemesterType}
                onChange={(e) => setSelectedSemesterType(e.target.value)}
                className="w-full px-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                <option value="">All Types</option>
                <option value="odd">Odd Semesters</option>
                <option value="even">Even Semesters</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedSemesterType || selectedSemester || searchTerm) && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FiFilter className="w-5 h-5 text-gray-500" />
                <span className="text-base font-medium text-gray-700">
                  Active filters:
                </span>
                <div className="flex gap-3">
                  {selectedSemesterType && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-base font-medium">
                      {selectedSemesterType === "even"
                        ? "Even Semesters"
                        : "Odd Semesters"}
                    </span>
                  )}
                  {selectedSemester && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-base font-medium">
                      Semester {selectedSemester}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-base font-medium">
                      Search: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSemesterType("");
                  setSelectedSemester("");
                  setSearchTerm("");
                }}
                className="text-base text-gray-600 hover:text-gray-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-3 border-b-3 border-blue-600 mb-6"></div>
              <p className="text-lg text-gray-600">Loading courses...</p>
            </div>
          ) : sortedCourses.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "Course Code",
                    "Course Name",
                    "Semester",
                    "Credits",
                    "Category",
                    "Status",
                    "Actions",
                  ].map((header) => (
                    <th
                      key={header}
                      className="px-8 py-5 text-left text-base font-semibold text-gray-700"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedCourses.map((course) => (
                  <tr
                    key={course.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* COURSE CODE */}
                    <td className="px-8 py-5">
                      <div className="font-mono font-bold text-gray-900 text-lg">
                        {course.code}
                      </div>
                    </td>

                    {/* COURSE NAME */}
                    <td className="px-8 py-5">
                      <div className="text-gray-900 font-medium text-lg">
                        {course.name}
                      </div>
                    </td>

                    {/* SEMESTER */}
                    <td className="px-8 py-5 text-center align-middle">
                      <div className="text-gray-900 font-medium text-lg">
                        {course.semester}
                      </div>
                    </td>

                    {/* CREDITS */}
                    <td className="px-8 py-5 text-center align-middle">
                      <div className="font-bold text-gray-900 text-lg">
                        {course.credits}
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td className="px-8 py-5 text-center align-middle">
                      <span className="text-gray-700 text-lg font-medium capitalize">
                        {course.category || "—"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-8 py-5 text-center align-middle">
                      {course.isActive ? (
                        <span className="inline-flex items-center justify-center gap-2 text-green-600 text-lg font-medium">
                          <FiCheckCircle className="w-5 h-5" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-2 text-gray-600 text-lg font-medium">
                          <FiXCircle className="w-5 h-5" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-8 py-5 text-center align-middle">
                      <div className="flex items-center justify-center gap-2">
                        {actionButtons.map((btn) => {
                          // Check if this is the CLOs button and if course has CLOs
                          const isClosButton = btn.id === "clos";
                          const hasClos = course.clos && course.clos.length > 0;
                          const buttonColor =
                            isClosButton && !hasClos
                              ? "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              : btn.color;
                          const buttonTitle =
                            isClosButton && !hasClos
                              ? "CLOs not created for this course"
                              : btn.label;

                          return (
                            <button
                              key={btn.id}
                              onClick={() => btn.action(course)}
                              className={`flex items-center gap-2 px-5 py-3 rounded-lg ${buttonColor} transition-colors text-base font-medium`}
                              title={buttonTitle}
                            >
                              {btn.icon}
                              <span>{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <FiGrid className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                No courses found
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                {searchTerm || selectedSemester || selectedSemesterType
                  ? "No courses match your current filters. Try adjusting your search criteria."
                  : "Start building your curriculum by adding the first course."}
              </p>
              <button
                onClick={handleAddCourse}
                className="inline-flex items-center gap-3 px-7 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-base shadow-sm"
              >
                <FiPlus className="w-6 h-6" />
                Add Your First Course
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TABLE FOOTER */}
      {sortedCourses.length > 0 && (
        <div className="mt-8 flex items-center justify-between px-4">
          <p className="text-lg text-gray-700">
            Showing{" "}
            <span className="font-bold text-gray-900">
              {sortedCourses.length}
            </span>{" "}
            of <span className="font-bold text-gray-900">{courses.length}</span>{" "}
            courses
          </p>
          {sortedCourses.length > 10 && (
            <button className="text-lg text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2">
              View all courses
              <FiChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* MODAL */}
      <CourseForm
        open={openForm}
        initialData={editCourse}
        onClose={() => setOpenForm(false)}
        onSaved={handleCourseSaved}
      />
    </div>
  );
};

export default CourseManagement;
