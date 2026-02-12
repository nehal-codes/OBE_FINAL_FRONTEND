import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import HOD_API from '../../../apis/HOD';
import {
  FiPlus,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiBook,
  FiUser,
  FiMail,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiSave,
  FiDownload,
  FiBarChart2,
  FiUsers,
  FiAward,
  FiChevronRight,
  FiDivide,
} from 'react-icons/fi';

const AssignFaculty = () => {
  const { courseId } = useParams();
  
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [availableFaculties, setAvailableFaculties] = useState([]);
  
  const [openDialog, setOpenDialog] = useState(false);
  const [openWorkloadDialog, setOpenWorkloadDialog] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  
  const [formData, setFormData] = useState({
    facultyId: '',
    semester: course?.semester || '',
    year: new Date().getFullYear(),
    teachingMethodology: '',
    assessmentMode: '',
  });
  
  const [filters, setFilters] = useState({
    semester: '',
    semesterType: '',
    year: new Date().getFullYear(),
  });
  
  const [loading, setLoading] = useState({
    course: true,
    assignments: true,
    faculties: true,
  });

  // Fetch course details
  const fetchCourseDetails = async () => {
    try {
      console.log("📘 Fetching course details for ID:", courseId);
      
      try {
        const response = await HOD_API.courses.getCourse(courseId);
        console.log("✅ Course details response:", response.data);
        setCourse(response.data);
      } catch (courseError) {
        console.warn("Could not fetch single course, trying all courses:", courseError);
        
        const response = await HOD_API.courses.getCourses();
        const courseData = response.data?.find(c => c.id === courseId);
        
        if (courseData) {
          console.log("✅ Found course in list:", courseData);
          setCourse(courseData);
          
          if (courseData.semester) {
            setFormData(prev => ({ ...prev, semester: courseData.semester.toString() }));
          }
        } else {
          console.error("❌ Course not found in list");
          alert('Course not found');
        }
      }
    } catch (error) {
      console.error('❌ Error fetching course:', error);
      alert('Failed to load course details');
    } finally {
      setLoading(prev => ({ ...prev, course: false }));
    }
  };

  // Fetch assignments with even/odd filtering
  const fetchAssignments = async () => {
    try {
      console.log("🔄 Fetching assignments for:", {
        courseId,
        semester: filters.semester,
        year: filters.year
      });
      
      const response = await HOD_API.assignments.getCourseAssignments(
        courseId,
        filters.semester,
        filters.year
      );
      
      console.log("✅ Assignments API response:", response);
      
      let assignmentsData = [];
      
      if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (response.data && Array.isArray(response.data.assignments)) {
        assignmentsData = response.data.assignments;
      } else if (response.data && response.data.data) {
        assignmentsData = response.data.data.assignments || response.data.data || [];
      }
      
      console.log("📊 Processed assignments data:", assignmentsData);
      
      // Apply semester type filter (even/odd) if selected
      let filteredData = assignmentsData;
      if (filters.semesterType) {
        filteredData = assignmentsData.filter(assignment => {
          if (!assignment.semester) return false;
          const semesterNum = parseInt(assignment.semester);
          if (filters.semesterType === 'even') {
            return semesterNum % 2 === 0;
          } else if (filters.semesterType === 'odd') {
            return semesterNum % 2 === 1;
          }
          return true;
        });
      }
      
      setAssignments(filteredData);
      
    } catch (error) {
      console.error("❌ Error fetching assignments:", error);
      
      if (error.response?.status === 404) {
        console.log("No assignments found (404)");
        setAssignments([]);
      } else {
        alert('Failed to load assignments. Please try again.');
        setAssignments([]);
      }
    } finally {
      setLoading(prev => ({ ...prev, assignments: false }));
    }
  };

  // Fetch department faculties
  const fetchFaculties = async () => {
    try {
      console.log("👥 Fetching department faculties...");
      const response = await HOD_API.assignments.getDepartmentFaculties();
      console.log("✅ Faculties response:", response.data);
      
      const facultiesData = Array.isArray(response.data) 
        ? response.data 
        : response.data?.faculties 
        ? response.data.faculties 
        : response.data?.data 
        ? response.data.data 
        : [];
      
      setFaculties(facultiesData);
    } catch (error) {
      console.error('❌ Error fetching faculties:', error);
      alert('Failed to load faculties');
      setFaculties([]);
    } finally {
      setLoading(prev => ({ ...prev, faculties: false }));
    }
  };

  // Fetch available faculties
  const fetchAvailableFaculties = async () => {
    try {
      if (!formData.semester || !formData.year) {
        console.log("⚠️ Skipping available faculties fetch: missing semester or year");
        setAvailableFaculties([]);
        return;
      }
      
      console.log("🔍 Fetching available faculties for:", {
        courseId,
        semester: formData.semester,
        year: formData.year
      });
      
      const response = await HOD_API.assignments.getAvailableFacultiesForCourse(
        courseId,
        formData.semester,
        formData.year
      );
      
      console.log("✅ Available faculties response:", response.data);
      
      const availableFacultiesData = Array.isArray(response.data)
        ? response.data
        : response.data?.faculties
        ? response.data.faculties
        : response.data?.data
        ? response.data.data
        : [];
      
      setAvailableFaculties(availableFacultiesData);
      
    } catch (error) {
      console.error('❌ Error fetching available faculties:', error);
      setAvailableFaculties([]);
    }
  };

  // Initialize data fetching
  useEffect(() => {
    if (courseId) {
      console.log("🚀 Initializing AssignFaculty component with courseId:", courseId);
      fetchCourseDetails();
      fetchAssignments();
      fetchFaculties();
    } else {
      console.error("❌ No courseId provided!");
      alert("No course specified");
    }
  }, [courseId]);

  // Refetch assignments when filters change
  useEffect(() => {
    if (courseId) {
      console.log("🔍 Filters changed, refetching assignments...");
      fetchAssignments();
    }
  }, [filters.semester, filters.year, filters.semesterType]);

  // Refetch available faculties when semester/year changes
  useEffect(() => {
    if (formData.semester && formData.year) {
      console.log("🔄 Semester/Year changed, fetching available faculties...");
      fetchAvailableFaculties();
    } else {
      setAvailableFaculties([]);
    }
  }, [formData.semester, formData.year]);

  // Update form semester when course loads
  useEffect(() => {
    if (course?.semester) {
      console.log("📝 Updating form semester from course:", course.semester);
      setFormData(prev => ({ ...prev, semester: course.semester.toString() }));
    }
  }, [course]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    console.log(`🎯 Filter changed: ${name} = ${value}`);
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    console.log(`📝 Form field changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleOpenDialog = () => {
    console.log("➕ Opening assign faculty dialog");
    
    const semesterToUse = course?.semester ? course.semester.toString() : '';
    
    setFormData({
      facultyId: '',
      semester: semesterToUse,
      year: new Date().getFullYear(),
      teachingMethodology: '',
      assessmentMode: '',
    });
    
    setOpenDialog(true);
    
    if (semesterToUse) {
      setTimeout(() => {
        fetchAvailableFaculties();
      }, 100);
    }
  };

  const handleCloseDialog = () => {
    console.log("❌ Closing assign faculty dialog");
    setOpenDialog(false);
  };

  const handleSubmitAssignment = async () => {
    try {
      console.log("📤 Submitting assignment form:", formData);
      
      if (!formData.facultyId) {
        alert('Please select a faculty member');
        return;
      }
      if (!formData.semester) {
        alert('Please select a semester');
        return;
      }
      if (!formData.year) {
        alert('Please select a year');
        return;
      }

      console.log("🚀 Calling API to assign faculty...");
      await HOD_API.assignments.assignFacultyToCourse(courseId, formData);
      
      alert('✅ Faculty assigned successfully!');
      handleCloseDialog();
      
      fetchAssignments();
      fetchAvailableFaculties();
      
    } catch (error) {
      console.error('❌ Error assigning faculty:', error);
      const errorMessage = error.response?.data?.error 
        || error.response?.data?.message 
        || 'Failed to assign faculty. Please try again.';
      alert(errorMessage);
    }
  };

  const handleViewWorkload = (faculty) => {
    console.log("📋 Viewing workload for faculty:", faculty);
    setSelectedFaculty(faculty);
    setOpenWorkloadDialog(true);
  };

  const handleUpdateAssignment = async (assignment) => {
    try {
      console.log("✏️ HOD updating/reassigning assignment:", assignment);
      
      const availableFaculties = faculties.filter(f => f.id !== assignment.facultyId);
      
      const facultyOptions = availableFaculties
        .map(f => `${f.id}: ${f.name}`)
        .join('\n');
      
      const reassignChoice = confirm(
        `Current Faculty: ${assignment.facultyName} (ID: ${assignment.facultyId})\n\n` +
        `Do you want to reassign this course to a different faculty?`
      );
      
      let newFacultyId = null;
      
      if (reassignChoice) {
        newFacultyId = prompt(
          `Available Faculties:\n${facultyOptions}\n\n` +
          `Enter Faculty ID to reassign to:`,
          ''
        );
        
        if (newFacultyId === null) return;
        
        if (newFacultyId.trim() === '') {
          newFacultyId = null;
        } else if (newFacultyId === assignment.facultyId) {
          alert("⚠️ That's the same faculty! No change will be made.");
          newFacultyId = null;
        }
      }
      
      const newTeachingMethod = prompt(
        'Enter teaching methodology:',
        assignment.teachingMethodology || ''
      );
      
      if (newTeachingMethod === null) return;
      
      const newAssessmentMode = prompt(
        'Enter assessment mode:',
        assignment.assessmentMode || ''
      );
      
      if (newAssessmentMode === null) return;
      
      const updateData = {
        teachingMethodology: newTeachingMethod,
        assessmentMode: newAssessmentMode,
      };
      
      if (newFacultyId && newFacultyId !== assignment.facultyId) {
        updateData.newFacultyId = newFacultyId;
      }
      
      console.log("📤 Sending update data:", updateData);
      
      await HOD_API.assignments.updateAssignment(
        assignment.courseId,
        assignment.facultyId,
        assignment.semester,
        assignment.year,
        updateData
      );
      
      if (newFacultyId) {
        alert(`✅ Faculty reassigned successfully!\n\n` +
              `Course: ${assignment.courseName}\n` +
              `Old Faculty: ${assignment.facultyName}\n` +
              `New Faculty ID: ${newFacultyId}`);
      } else {
        alert('✅ Assignment details updated successfully!');
      }
      
      fetchAssignments();
      
    } catch (error) {
      console.error('❌ Error updating assignment:', error);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Failed to update assignment';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleRemoveAssignment = async (assignment) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }
    
    try {
      console.log("🗑️ Removing assignment:", assignment);
      
      await HOD_API.assignments.removeAssignment(
        assignment.courseId,
        assignment.facultyId,
        assignment.semester,
        assignment.year
      );
      
      alert('✅ Assignment removed successfully!');
      fetchAssignments();
      fetchAvailableFaculties();
      
    } catch (error) {
      console.error('❌ Error removing assignment:', error);
      alert(error.response?.data?.error || 'Failed to remove assignment');
    }
  };

  const getSemesterLabel = (semester) => {
    if (!semester) return 'Not specified';
    
    const semesterNum = parseInt(semester);
    switch (semesterNum) {
      case 1: return 'Semester I';
      case 2: return 'Semester II';
      case 3: return 'Semester III';
      case 4: return 'Semester IV';
      case 5: return 'Semester V';
      case 6: return 'Semester VI';
      case 7: return 'Semester VII';
      case 8: return 'Semester VIII';
      default: return `Semester ${semester}`;
    }
  };

  // Debug info
  useEffect(() => {
    console.log("📊 Current state:", {
      course: course ? `Loaded: ${course.code} - ${course.name}` : 'Not loaded',
      assignmentsCount: assignments.length,
      facultiesCount: faculties.length,
      availableFacultiesCount: availableFaculties.length,
      loading: loading,
      filters: filters,
      formData: formData
    });
  }, [course, assignments, faculties, availableFaculties, loading, filters, formData]);

  if (loading.course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-3 border-blue-600 mb-6"></div>
          <p className="text-gray-600 text-lg">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 max-w-md mx-auto mt-10">
        <div className="flex items-center gap-4 mb-6">
          <FiXCircle className="text-red-600 text-3xl" />
          <h3 className="text-2xl font-semibold text-gray-900">Course Not Found</h3>
        </div>
        <p className="text-gray-600 text-lg mb-6">The requested course could not be found. Please check the URL or go back to the courses list.</p>
        <button 
          className="flex items-center gap-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors text-lg font-medium"
          onClick={() => window.history.back()}
        >
          <FiArrowLeft className="text-xl" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-colors mb-8 text-lg font-medium"
        >
          <FiArrowLeft className="text-xl" />
          <span>Back to Courses</span>
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiUsers className="text-3xl" />
                </div>
                <h1 className="text-3xl font-bold">Faculty Assignment</h1>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-white/10 px-5 py-3 rounded-xl">
                  <div className="font-bold text-lg mb-1">{course.name}</div>
                  <div className="text-sm opacity-90">{course.code} • {course.credits || 0} credits • {course.type || 'N/A'}</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleOpenDialog}
              disabled={loading.assignments}
              className="flex items-center justify-center gap-3 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 font-medium text-lg"
            >
              <FiPlus className="text-xl" />
              <span>Assign New Faculty</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <FiFilter className="text-gray-600 text-lg" />
            Filter Assignments
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            {/* Semester Type Filter */}
            <div>
              <label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiDivide className="w-5 h-5" />
                Semester Type
              </label>
              <select
                name="semesterType"
                value={filters.semesterType}
                onChange={handleFilterChange}
                className="w-full p-3 text-base border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="even">Even Semesters</option>
                <option value="odd">Odd Semesters</option>
              </select>
            </div>

            {/* Specific Semester Filter */}
            <div>
              <label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiFilter className="w-5 h-5" />
                Specific Semester
              </label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                disabled={loading.assignments}
                className="w-full p-3 text-base border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    {getSemesterLabel(sem)}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="text-base font-medium text-gray-700 mb-2 flex items-center gap-2">
                <FiCalendar className="w-5 h-5" />
                Filter by Year
              </label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                disabled={loading.assignments}
                className="w-full p-3 text-base border border-gray-300 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              >
                {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button 
                onClick={fetchAssignments}
                disabled={loading.assignments}
                className="flex items-center justify-center gap-3 w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <FiRefreshCw className={`text-lg ${loading.assignments ? 'animate-spin' : ''}`} />
                <span>{loading.assignments ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.semesterType || filters.semester || filters.year !== new Date().getFullYear()) && (
            <div className="mt-5 pt-5 border-t border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-3">
                <FiFilter className="w-5 h-5" />
                <span className="font-medium">Active Filters:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.semesterType && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {filters.semesterType === "even" ? "Even Semesters" : "Odd Semesters"}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, semesterType: "" }))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.semester && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-800 rounded-full text-sm">
                    Semester {filters.semester}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, semester: "" }))}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.year !== new Date().getFullYear() && (
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm">
                    Year: {filters.year}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, year: new Date().getFullYear() }))}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilters({
                      semester: '',
                      semesterType: '',
                      year: new Date().getFullYear(),
                    });
                  }}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-200 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <FiClock className="text-gray-600 text-lg" />
            Faculty Assignments
            <span className="text-base font-normal text-gray-600 ml-2">
              ({assignments.length} assigned)
            </span>
          </h2>
        </div>

        {loading.assignments ? (
          <div className="p-16 text-center">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-t-3 border-b-3 border-blue-600 mb-4"></div>
            <p className="text-lg text-gray-600">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-16 text-center">
            <div className="text-gray-400 mb-6">
              <FiUsers className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-3">No Faculty Assigned</h3>
            <p className="text-lg text-gray-600 max-w-md mx-auto mb-8">
              {filters.semester || filters.year || filters.semesterType
                ? `No faculty assignments found for the selected filters`
                : `No faculty assigned to ${course.code} yet`}
            </p>
            <button 
              onClick={handleOpenDialog}
              className="inline-flex items-center gap-3 px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-lg"
            >
              <FiPlus className="w-6 h-6" />
              <span>Assign First Faculty</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="p-5 text-left font-semibold text-gray-700 text-lg">Faculty Information</th>
                  <th className="p-5 text-left font-semibold text-gray-700 text-lg">Academic Year</th>
                  <th className="p-5 text-left font-semibold text-gray-700 text-lg">Teaching Details</th>
                  <th className="p-5 text-left font-semibold text-gray-700 text-lg">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment, index) => (
                  <tr 
                    key={`${assignment.facultyId || index}-${assignment.semester}-${assignment.year}`} 
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Faculty Information */}
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <FiUser className="text-blue-600 text-lg" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">
                            {assignment.faculty?.name || assignment.facultyName || `Faculty ${assignment.facultyId?.substring(0, 8) || 'Unknown'}`}
                          </div>
                          <div className="text-base text-gray-600 flex items-center gap-2 mt-1">
                            <FiMail className="text-gray-500 text-sm" />
                            {assignment.faculty?.user?.email || assignment.facultyEmail || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 mt-2">
                            {assignment.faculty?.designation || 'No designation'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Academic Year */}
                    <td className="p-5">
                      <div>
                        <div className="font-medium text-gray-900 text-lg">{assignment.semester}</div>
                        <div className="text-base text-gray-600">{assignment.year}</div>
                      </div>
                    </td>

                    {/* Teaching Details */}
                    <td className="p-5">
                      <div className="space-y-2">
                        <div>
                          <div className="text-base text-gray-600 mb-1">Teaching Methodology</div>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${assignment.teachingMethodology ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                            {assignment.teachingMethodology || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <div className="text-base text-gray-600 mb-1">Assessment Mode</div>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${assignment.assessmentMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {assignment.assessmentMode || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewWorkload(assignment.faculty)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-gray-600 hover:text-gray-700 hover:bg-gray-100 transition-colors text-base"
                          title="View Workload"
                        >
                          <FiEye className="w-5 h-5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleUpdateAssignment(assignment)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors text-base"
                          title="Edit Assignment"
                        >
                          <FiEdit2 className="w-5 h-5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleRemoveAssignment(assignment)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-base"
                          title="Remove Assignment"
                        >
                          <FiTrash2 className="w-5 h-5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Table Footer Info */}
      {assignments.length > 0 && (
        <div className="mt-6 px-2">
          <p className="text-base text-gray-600">
            Showing <span className="font-semibold">{assignments.length}</span> assignments
            {filters.semesterType && ` in ${filters.semesterType === 'even' ? 'Even' : 'Odd'} Semesters`}
            {filters.semester && ` for Semester ${filters.semester}`}
            {filters.year !== new Date().getFullYear() && ` in ${filters.year}`}
          </p>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FiPlus className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Assign Faculty to Course</h2>
                    <p className="text-blue-100 text-sm">
                      {course.code} - {course.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDialog}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiXCircle className="text-white text-lg" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      <FiCalendar className="inline mr-2 text-gray-600" />
                      Academic Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      required
                      className="w-full p-3 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      <FiCalendar className="inline mr-2 text-gray-600" />
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleFormChange}
                      required
                      className="w-full p-3 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          {getSemesterLabel(sem)}
                        </option>
                      ))}
                    </select>
                    {course.semester && !formData.semester && (
                      <p className="text-sm text-gray-600 mt-2">
                        Course is typically taught in {getSemesterLabel(course.semester)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    <FiUser className="inline mr-2 text-gray-600" />
                    Select Faculty
                  </label>
                  <select
                    name="facultyId"
                    value={formData.facultyId}
                    onChange={handleFormChange}
                    required
                    disabled={!formData.semester || !formData.year}
                    className="w-full p-3 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="">Select Faculty</option>
                    {availableFaculties.length === 0 ? (
                      <option value="" disabled>
                        {!formData.semester || !formData.year 
                          ? 'Please select semester and year first' 
                          : 'No available faculty found'}
                      </option>
                    ) : (
                      availableFaculties.map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {faculty.name} • {faculty.designation || 'No designation'}
                        </option>
                      ))
                    )}
                  </select>
                  {formData.semester && formData.year && (
                    <p className="text-sm text-gray-600 mt-2">
                      {availableFaculties.length} faculty member(s) available for {getSemesterLabel(formData.semester)} {formData.year}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Teaching Methodology (Optional)
                  </label>
                  <input
                    type="text"
                    name="teachingMethodology"
                    value={formData.teachingMethodology}
                    onChange={handleFormChange}
                    placeholder="e.g., Lecture-based, Flipped Classroom, Lab Sessions, etc."
                    className="w-full p-3 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-base font-medium text-gray-700 mb-2">
                    Assessment Mode (Optional)
                  </label>
                  <input
                    type="text"
                    name="assessmentMode"
                    value={formData.assessmentMode}
                    onChange={handleFormChange}
                    placeholder="e.g., Continuous Assessment, Final Exam, Project-based, etc."
                    className="w-full p-3 text-base border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseDialog}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAssignment}
                  disabled={!formData.facultyId || !formData.semester || !formData.year}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-base disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <FiSave className="text-lg" />
                  <span>Assign Faculty</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Workload Modal */}
      {openWorkloadDialog && selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg border border-gray-200 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FiBarChart2 className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Faculty Workload Details</h2>
                    <p className="text-emerald-100 text-sm">
                      {selectedFaculty.name} • {selectedFaculty.designation || 'No designation'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenWorkloadDialog(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <FiXCircle className="text-white text-lg" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-72px)]">
              <FacultyWorkload faculty={selectedFaculty} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Faculty Workload Component
const FacultyWorkload = ({ faculty }) => {
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWorkload = async () => {
      try {
        console.log("📋 Fetching workload for faculty:", faculty.id);
        const response = await HOD_API.assignments.getFacultyWorkload(faculty.id);
        console.log("✅ Workload response:", response.data);
        setWorkload(response.data);
        setError(null);
      } catch (error) {
        console.error('❌ Error fetching workload:', error);
        setError('Failed to load workload data');
        setWorkload(null);
      } finally {
        setLoading(false);
      }
    };

    if (faculty && faculty.id) {
      fetchWorkload();
    }
  }, [faculty]);

  const getSemesterLabel = (semester) => {
    if (!semester) return 'N/A';
    const semesterNum = parseInt(semester);
    switch (semesterNum) {
      case 1: return 'Semester I';
      case 2: return 'Semester II';
      case 3: return 'Semester III';
      case 4: return 'Semester IV';
      case 5: return 'Semester V';
      case 6: return 'Semester VI';
      case 7: return 'Semester VII';
      case 8: return 'Semester VIII';
      default: return `Semester ${semester}`;
    }
  };

  if (loading) {
    return (
      <div className="py-10 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-base text-gray-600">Loading faculty workload...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiXCircle className="text-red-600 text-lg" />
          <h3 className="text-lg font-semibold text-gray-900">Error Loading Data</h3>
        </div>
        <p className="text-gray-700 text-base">{error}</p>
      </div>
    );
  }

  if (!workload) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <FiBarChart2 className="text-gray-600 text-lg" />
          <h3 className="text-lg font-semibold text-gray-900">No Workload Data Available</h3>
        </div>
        <p className="text-gray-700 text-base">No workload data available for this faculty member.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Faculty Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-5 border border-emerald-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <div className="text-base text-emerald-800 font-semibold mb-1">Name</div>
            <div className="font-bold text-gray-900 text-lg">{workload.faculty?.name || faculty.name}</div>
          </div>
          <div>
            <div className="text-base text-emerald-800 font-semibold mb-1">Designation</div>
            <div className="font-bold text-gray-900 text-lg">{workload.faculty?.designation || 'N/A'}</div>
          </div>
          <div>
            <div className="text-base text-emerald-800 font-semibold mb-1">Department</div>
            <div className="font-bold text-gray-900 text-lg">{workload.faculty?.department || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Workload Summary */}
      {workload.workloadSummary && workload.workloadSummary.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FiBarChart2 className="text-lg" />
            Workload Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workload.workloadSummary.map((summary, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-bold text-gray-900 text-base">{summary.year}</div>
                    <div className="text-sm text-gray-600">{getSemesterLabel(summary.semester)}</div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                    <span className="font-bold text-emerald-800 text-lg">{summary.totalCredits || 0}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-700 mb-3">
                  {summary.courseCount || 0} course(s) assigned
                </div>
                {summary.courses && summary.courses.length > 0 && (
                  <div className="space-y-1">
                    {summary.courses.slice(0, 3).map((course, idx) => (
                      <div key={idx} className="text-xs text-gray-800 flex justify-between">
                        <span className="truncate font-medium">{course.courseCode}</span>
                        <span className="font-bold">{course.credits || 0} cr</span>
                      </div>
                    ))}
                    {summary.courses.length > 3 && (
                      <div className="text-xs text-gray-600">+{summary.courses.length - 3} more</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Assignments */}
      {workload.assignments && workload.assignments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FiClock className="text-lg" />
              Course Assignments
            </h3>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <FiDownload className="text-base" />
              Export
            </button>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Course Code
                    </th>
                    <th className="py-3 px-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Course Name
                    </th>
                    <th className="py-3 px-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Year/Semester
                    </th>
                    <th className="py-3 px-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Credits
                    </th>
                    <th className="py-3 px-5 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workload.assignments.map((assignment, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-5 font-bold text-gray-900 text-base">
                        {assignment.course?.code || 'N/A'}
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-semibold text-gray-900 text-base">{assignment.course?.name || 'N/A'}</div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                            <span className="text-sm font-bold text-emerald-800">{assignment.year}</span>
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{getSemesterLabel(assignment.semester)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                          <span className="font-bold text-blue-800 text-base">{assignment.course?.credits || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {assignment.course?.type || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignFaculty;