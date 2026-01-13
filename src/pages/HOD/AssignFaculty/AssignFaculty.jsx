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

  // Fetch assignments
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
      setAssignments(assignmentsData);
      
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
  }, [filters.semester, filters.year]);

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
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-white rounded-xl transition-colors mb-8 text-lg font-medium"
        >
          <FiArrowLeft className="text-xl" />
          <span>Back to Courses</span>
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 md:p-10 text-white mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <FiUsers className="text-3xl" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold">Faculty Assignment</h1>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                  <FiBook className="text-xl" />
                  <span className="font-semibold">{course.code} - {course.name}</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-xl text-lg">
                  <FiAward className="text-xl" />
                  <span>{course.credits || 0} credits • {course.type || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleOpenDialog}
              disabled={loading.assignments}
              className="flex items-center justify-center gap-3 px-7 py-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed text-lg"
            >
              <FiPlus className="text-xl" />
              <span className="font-bold">Assign New Faculty</span>
            </button>
          </div>
        </div>

        {/* Filters - Increased size */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
            <FiFilter className="text-gray-600 text-xl" />
            Filter Assignments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-800 mb-3">
                <FiCalendar className="inline mr-3 text-gray-600" />
                Filter by Semester
              </label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                disabled={loading.assignments}
                className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl bg-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    {getSemesterLabel(sem)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-lg font-medium text-gray-800 mb-3">
                <FiCalendar className="inline mr-3 text-gray-600" />
                Filter by Year
              </label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                disabled={loading.assignments}
                className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl bg-white focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button 
                onClick={fetchAssignments}
                disabled={loading.assignments}
                className="flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <FiRefreshCw className={`text-xl ${loading.assignments ? 'animate-spin' : ''}`} />
                <span>{loading.assignments ? 'Refreshing...' : 'Refresh Assignments'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary - Increased size */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-blue-800 font-semibold mb-2">Department Faculty</p>
              <p className="text-3xl font-bold text-gray-900">{faculties.length}</p>
            </div>
            <FiUsers className="text-blue-600 text-3xl" />
          </div>
          <p className="text-base text-gray-700 mt-3">
            {availableFaculties.length} available for current filters
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border-2 border-emerald-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-emerald-800 font-semibold mb-2">Current Assignments</p>
              <p className="text-3xl font-bold text-gray-900">{assignments.length}</p>
            </div>
            <FiCheckCircle className="text-emerald-600 text-3xl" />
          </div>
          <p className="text-base text-gray-700 mt-3">
            {filters.semester ? getSemesterLabel(filters.semester) : 'All semesters'} • {filters.year}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-amber-800 font-semibold mb-2">Course Credits</p>
              <p className="text-3xl font-bold text-gray-900">{course.credits || 0}</p>
            </div>
            <FiAward className="text-amber-600 text-3xl" />
          </div>
          <p className="text-base text-gray-700 mt-3">
            {course.type || 'No type'} • Semester {course.semester || 'N/A'}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-purple-800 font-semibold mb-2">Course Status</p>
              <p className="text-3xl font-bold text-gray-900">
                {course.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <FiBarChart2 className="text-purple-600 text-3xl" />
          </div>
          <div className={`text-base font-semibold mt-3 px-3 py-2 rounded-full inline-block ${course.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
            {course.isActive ? 'Available for assignment' : 'Not available'}
          </div>
        </div>
      </div>

      {/* Assignments Table - Increased size */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-xl mb-10">
        <div className="p-7 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FiClock className="text-gray-600 text-2xl" />
            Faculty Assignments
            <span className="text-lg font-normal text-gray-600 ml-3">
              ({assignments.length} assigned)
            </span>
          </h2>
        </div>

        {loading.assignments ? (
          <div className="p-14 text-center">
            <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-3 border-blue-600 mb-6"></div>
            <p className="text-gray-600 text-lg">Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-14 text-center">
            <div className="text-gray-400 mb-6">
              <FiUsers className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No Faculty Assigned</h3>
            <p className="text-gray-700 text-lg max-w-md mx-auto mb-8">
              {filters.semester || filters.year 
                ? `No faculty assignments found for ${filters.semester ? getSemesterLabel(filters.semester) : ''} ${filters.year}`
                : `No faculty assigned to ${course.code} yet`}
            </p>
            <button 
              onClick={handleOpenDialog}
              className="flex items-center gap-3 mx-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all text-lg font-semibold"
            >
              <FiPlus className="text-xl" />
              <span>Assign First Faculty</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-5 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                    Faculty Information
                  </th>
                  <th className="py-5 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                    Academic Year
                  </th>
                  <th className="py-5 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                    Teaching Details
                  </th>
                  <th className="py-5 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {assignments.map((assignment, index) => (
                  <tr key={`${assignment.facultyId || index}-${assignment.semester}-${assignment.year}`} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-7">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                          <FiUser className="text-blue-600 text-xl" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">
                            {assignment.faculty?.name || assignment.facultyName || `Faculty ${assignment.facultyId?.substring(0, 8) || 'Unknown'}`}
                          </div>
                          <div className="text-base text-gray-700 flex items-center gap-3 mt-1">
                            <FiMail className="text-gray-500" />
                            {assignment.faculty?.user?.email || assignment.facultyEmail || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 mt-2">
                            {assignment.faculty?.designation || 'No designation'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-7">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                          <span className="font-bold text-emerald-800 text-lg">
                            {assignment.semester}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-lg">{getSemesterLabel(assignment.semester)}</div>
                          <div className="text-base text-gray-700">{assignment.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-7">
                      <div className="space-y-3">
                        <div>
                          <div className="text-base text-gray-600 mb-2">Teaching Methodology</div>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${assignment.teachingMethodology ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'}`}>
                            {assignment.teachingMethodology || 'Not specified'}
                          </span>
                        </div>
                        <div>
                          <div className="text-base text-gray-600 mb-2">Assessment Mode</div>
                          <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${assignment.assessmentMode ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                            {assignment.assessmentMode || 'Not specified'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-7">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewWorkload(assignment.faculty)}
                          className="p-3 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
                          title="View Workload"
                        >
                          <FiEye className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleUpdateAssignment(assignment)}
                          className="p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          title="Edit Assignment"
                        >
                          <FiEdit2 className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleRemoveAssignment(assignment)}
                          className="p-3 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          title="Remove Assignment"
                        >
                          <FiTrash2 className="text-xl" />
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

      {/* Assign Faculty Modal - Increased size */}
      {openDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FiPlus className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Assign Faculty to Course</h2>
                    <p className="text-blue-100 text-lg">
                      {course.code} - {course.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDialog}
                  className="p-3 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <FiXCircle className="text-white text-2xl" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-96px)]">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      <FiCalendar className="inline mr-3 text-gray-600 text-xl" />
                      Academic Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleFormChange}
                      required
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-lg font-semibold text-gray-800 mb-3">
                      <FiCalendar className="inline mr-3 text-gray-600 text-xl" />
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleFormChange}
                      required
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option key={sem} value={sem}>
                          {getSemesterLabel(sem)}
                        </option>
                      ))}
                    </select>
                    {course.semester && !formData.semester && (
                      <p className="text-base text-gray-600 mt-2">
                        Course is typically taught in {getSemesterLabel(course.semester)}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    <FiUser className="inline mr-3 text-gray-600 text-xl" />
                    Select Faculty
                  </label>
                  <div className="relative">
                    <select
                      name="facultyId"
                      value={formData.facultyId}
                      onChange={handleFormChange}
                      required
                      disabled={!formData.semester || !formData.year}
                      className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none disabled:opacity-70 disabled:cursor-not-allowed"
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
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <FiChevronRight className="text-gray-500 text-xl" />
                    </div>
                  </div>
                  {formData.semester && formData.year && (
                    <p className="text-base text-gray-600 mt-3">
                      {availableFaculties.length} faculty member(s) available for {getSemesterLabel(formData.semester)} {formData.year}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Teaching Methodology (Optional)
                  </label>
                  <input
                    type="text"
                    name="teachingMethodology"
                    value={formData.teachingMethodology}
                    onChange={handleFormChange}
                    placeholder="e.g., Lecture-based, Flipped Classroom, Lab Sessions, etc."
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-800 mb-3">
                    Assessment Mode (Optional)
                  </label>
                  <input
                    type="text"
                    name="assessmentMode"
                    value={formData.assessmentMode}
                    onChange={handleFormChange}
                    placeholder="e.g., Continuous Assessment, Final Exam, Project-based, etc."
                    className="w-full px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-8 border-t-2 border-gray-200 bg-gray-50/50">
              <div className="flex justify-end gap-4">
                <button
                  onClick={handleCloseDialog}
                  className="px-7 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAssignment}
                  disabled={!formData.facultyId || !formData.semester || !formData.year}
                  className="flex items-center gap-3 px-9 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed font-semibold text-lg"
                >
                  <FiSave className="text-xl" />
                  <span>Assign Faculty</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Workload Modal - Increased size */}
      {openWorkloadDialog && selectedFaculty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FiBarChart2 className="text-white text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Faculty Workload Details</h2>
                    <p className="text-emerald-100 text-lg">
                      {selectedFaculty.name} • {selectedFaculty.designation || 'No designation'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpenWorkloadDialog(false)}
                  className="p-3 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <FiXCircle className="text-white text-2xl" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto max-h-[calc(90vh-96px)]">
              <FacultyWorkload faculty={selectedFaculty} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Faculty Workload Component - Increased size
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
      <div className="py-14 text-center">
        <div className="inline-block animate-spin rounded-full h-14 w-14 border-b-3 border-emerald-600 mb-6"></div>
        <p className="text-gray-600 text-lg">Loading faculty workload...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <FiXCircle className="text-red-600 text-2xl" />
          <h3 className="text-xl font-semibold text-gray-900">Error Loading Data</h3>
        </div>
        <p className="text-gray-700 text-lg">{error}</p>
      </div>
    );
  }

  if (!workload) {
    return (
      <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <FiBarChart2 className="text-gray-600 text-2xl" />
          <h3 className="text-xl font-semibold text-gray-900">No Workload Data Available</h3>
        </div>
        <p className="text-gray-700 text-lg">No workload data available for this faculty member.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Faculty Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-7 border-2 border-emerald-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-lg text-emerald-800 font-semibold mb-2">Name</div>
            <div className="font-bold text-gray-900 text-xl">{workload.faculty?.name || faculty.name}</div>
          </div>
          <div>
            <div className="text-lg text-emerald-800 font-semibold mb-2">Designation</div>
            <div className="font-bold text-gray-900 text-xl">{workload.faculty?.designation || 'N/A'}</div>
          </div>
          <div>
            <div className="text-lg text-emerald-800 font-semibold mb-2">Department</div>
            <div className="font-bold text-gray-900 text-xl">{workload.faculty?.department || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Workload Summary */}
      {workload.workloadSummary && workload.workloadSummary.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <FiBarChart2 className="text-xl" />
            Workload Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workload.workloadSummary.map((summary, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{summary.year}</div>
                    <div className="text-base text-gray-700">{getSemesterLabel(summary.semester)}</div>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                    <span className="font-bold text-emerald-800 text-xl">{summary.totalCredits || 0}</span>
                  </div>
                </div>
                <div className="text-base text-gray-700 mb-3">
                  {summary.courseCount || 0} course(s) assigned
                </div>
                {summary.courses && summary.courses.length > 0 && (
                  <div className="space-y-2">
                    {summary.courses.slice(0, 3).map((course, idx) => (
                      <div key={idx} className="text-sm text-gray-800 flex justify-between">
                        <span className="truncate font-medium">{course.courseCode}</span>
                        <span className="font-bold">{course.credits || 0} cr</span>
                      </div>
                    ))}
                    {summary.courses.length > 3 && (
                      <div className="text-sm text-gray-600">+{summary.courses.length - 3} more</div>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <FiClock className="text-xl" />
              Course Assignments
            </h3>
            <button className="flex items-center gap-3 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-lg font-semibold">
              <FiDownload className="text-xl" />
              Export
            </button>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                      Course Code
                    </th>
                    <th className="py-4 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                      Course Name
                    </th>
                    <th className="py-4 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                      Year/Semester
                    </th>
                    <th className="py-4 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                      Credits
                    </th>
                    <th className="py-4 px-7 text-left text-lg font-semibold text-gray-800 uppercase tracking-wider border-b-2 border-gray-300">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {workload.assignments.map((assignment, index) => (
                    <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-7 font-bold text-gray-900 text-lg">
                        {assignment.course?.code || 'N/A'}
                      </td>
                      <td className="py-5 px-7">
                        <div className="font-semibold text-gray-900 text-lg">{assignment.course?.name || 'N/A'}</div>
                      </td>
                      <td className="py-5 px-7">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center">
                            <span className="text-base font-bold text-emerald-800">{assignment.year}</span>
                          </div>
                          <span className="text-base text-gray-700 font-medium">{getSemesterLabel(assignment.semester)}</span>
                        </div>
                      </td>
                      <td className="py-5 px-7">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                          <span className="font-bold text-blue-800 text-lg">{assignment.course?.credits || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-5 px-7">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-base font-medium bg-gray-100 text-gray-800">
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