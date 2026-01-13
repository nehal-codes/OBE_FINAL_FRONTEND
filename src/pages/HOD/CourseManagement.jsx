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
  FiEye,
  FiDownload,
  FiMoreVertical,
} from "react-icons/fi";

const CourseManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [courses, setCourses] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredAction, setHoveredAction] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    // open form if navigated here with state (edit from review flow)
    if (location.state?.openCourseForm || location.state?.courseDraft) {
      setEditCourse(location.state?.courseDraft || null);
      setOpenForm(true);
      // clear the navigation state
      navigate(location.pathname, { replace: true });
    }
    if (!user) return;
    loadProgrammes();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    loadCourses();
  }, [user, selectedProgramme]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await HOD_API.courses.getAll(user?.token);

      let fetched = Array.isArray(res?.data) ? res.data : [];

      if (selectedProgramme) {
        fetched = fetched.filter(
          (c) =>
            String(c?.department?.program?.id || "") ===
            String(selectedProgramme)
        );
      }

      setCourses(fetched);
    } catch (err) {
      console.log("Error loading courses", err);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadProgrammes = async () => {
    try {
      const res = await HOD_API.programmes.getAll(user?.token);
      if (res?.data && Array.isArray(res.data)) {
        setProgrammes(res.data);
        return;
      }
    } catch (err) {
      console.warn(
        "Could not fetch programmes from API; falling back to program codes from courses.",
        err
      );
    }

    try {
      const res = await HOD_API.courses.getAll(user?.token);
      const unique = Array.from(
        new Map(
          (res.data || []).map((c) => [
            String(c?.department?.program?.id),
            c?.department?.program,
          ])
        ).values()
      ).filter(Boolean);
      setProgrammes(unique);
    } catch (err) {
      console.log("Error fetching programmes fallback", err);
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
    if (!window.confirm("Are you sure you want to deactivate this course?")) return;

    try {
      await HOD_API.courses.deleteCourse(id, user?.token);
      loadCourses();
    } catch (err) {
      alert("Error deleting course");
    }
  };

  const handleCourseSaved = (courseId) => {
    setOpenForm(false);
    loadCourses();
  };

  // Filter courses based on search term
  const filteredCourses = courses.filter(course => 
    course.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category) => {
    const colors = {
      'core': 'bg-blue-100 text-blue-800',
      'elective': 'bg-purple-100 text-purple-800',
      'lab': 'bg-green-100 text-green-800',
      'project': 'bg-amber-100 text-amber-800',
      'seminar': 'bg-pink-100 text-pink-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[category?.toLowerCase()] || colors.default;
  };

  // Action buttons with improved design
  const actionButtons = [
    {
      id: 'edit',
      icon: <FiEdit2 className="text-lg" />,
      label: 'Edit Course',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
      action: handleEdit,
    },
    {
      id: 'clos',
      icon: <FiBookOpen className="text-lg" />,
      label: 'Manage CLOs',
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600',
      action: (course) => navigate(`/hod/courses/${course.id}/clos`),
    },
    {
      id: 'faculty',
      icon: <FiUsers className="text-lg" />,
      label: 'Assign Faculty',
      color: 'bg-green-50 hover:bg-green-100 text-green-600',
      action: (course) => navigate(`/hod/courses/${course.id}/assign-faculty`),
    },
    {
      id: 'delete',
      icon: <FiTrash2 className="text-lg" />,
      label: 'Delete Course',
      color: 'bg-red-50 hover:bg-red-100 text-red-600',
      action: (course) => handleDelete(course.id),
    },
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Course Management</h1>
            <p className="text-gray-600">Manage and organize academic courses for your department</p>
          </div>
          <button
            onClick={handleAddCourse}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg group"
          >
            <FiPlus className="text-xl group-hover:scale-110 transition-transform" />
            <span className="font-semibold">Add New Course</span>
          </button>
        </div>

        {/* Filters & Search Bar */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Programme Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiFilter className="inline mr-2" />
                Filter by Programme
              </label>
              <div className="relative">
                <select
                  value={selectedProgramme}
                  onChange={(e) => setSelectedProgramme(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
                >
                  <option value="">All Programmes</option>
                  {(programmes || []).map((p) => (
                    <option key={p?.id} value={p?.id}>
                      {p?.code || p?.id} {p?.name ? `- ${p.name}` : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FiSearch className="inline mr-2" />
                Search Courses
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by course code, name, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading courses...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Course Code
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Course Name
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Credits
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Category
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Status
                  </th>
                  <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900 text-lg">{c.code}</div>
                      <div className="text-xs text-gray-500 mt-1">ID: {c.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 text-lg">{c.name}</div>
                      {c.department?.program?.name && (
                        <div className="text-sm text-gray-600 mt-1">
                          {c.department.program.name}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center shadow-sm">
                          <span className="font-bold text-blue-700 text-lg">{c.credits}</span>
                        </div>
                        <span className="ml-3 text-gray-600">credits</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getCategoryColor(c.category)}`}>
                        {c.category || 'Not specified'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        {c.isActive ? (
                          <>
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                              <FiCheckCircle className="text-emerald-600 text-xl" />
                            </div>
                            <div>
                              <span className="font-semibold text-emerald-700 block">Active</span>
                              <span className="text-xs text-gray-500">Available for use</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                              <FiXCircle className="text-gray-500 text-xl" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-600 block">Inactive</span>
                              <span className="text-xs text-gray-500">Not available</span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {actionButtons.map((btn) => (
                          <div key={btn.id} className="relative">
                            <button
                              onClick={() => btn.action(c)}
                              onMouseEnter={() => setHoveredAction(`${c.id}-${btn.id}`)}
                              onMouseLeave={() => setHoveredAction(null)}
                              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 ${btn.color} hover:scale-110 active:scale-95 shadow-sm hover:shadow-md`}
                            >
                              {btn.icon}
                            </button>
                            
                            {/* Tooltip */}
                            <div className={`absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap transition-all duration-200 ${hoveredAction === `${c.id}-${btn.id}` ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                              {btn.label}
                              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                            </div>
                          </div>
                        ))}
                        
                        {/* View Details Button (Extra option) */}
                        <div className="relative">
                          <button
                            onClick={() => navigate(`/hod/courses/${c.id}/details`)}
                            onMouseEnter={() => setHoveredAction(`${c.id}-view`)}
                            onMouseLeave={() => setHoveredAction(null)}
                            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-900 hover:scale-110 active:scale-95 shadow-sm hover:shadow-md"
                          >
                            <FiEye className="text-lg" />
                          </button>
                          
                          {/* Tooltip */}
                          <div className={`absolute z-50 top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap transition-all duration-200 ${hoveredAction === `${c.id}-view` ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                            View Details
                            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 14v6l9-5M12 20l-9-5" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
                      <p className="text-gray-600 max-w-md mx-auto mb-6">
                        {searchTerm || selectedProgramme
                          ? "Try adjusting your search or filter criteria"
                          : "Get started by adding your first course"}
                      </p>
                      {!searchTerm && !selectedProgramme && (
                        <button
                          onClick={handleAddCourse}
                          className="flex items-center gap-2 mx-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                        >
                          <FiPlus className="text-xl" />
                          <span className="font-semibold">Add Your First Course</span>
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Course Count */}
        {filteredCourses.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredCourses.length}</span> of <span className="font-semibold text-gray-900">{courses.length}</span> courses
                {selectedProgramme && " • Filtered by programme"}
              </p>
              <div className="flex items-center gap-4">
                {courses.length !== filteredCourses.length && (
                  <button
                    onClick={() => {
                      setSelectedProgramme("");
                      setSearchTerm("");
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear filters
                  </button>
                )}
               
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Form Modal */}
      <CourseForm
        open={openForm}
        initialData={editCourse}
        defaultProgrammeId={selectedProgramme}
        programmes={programmes}
        onClose={() => setOpenForm(false)}
        onSaved={handleCourseSaved}
      />
    </div>
  );
};

export default CourseManagement;