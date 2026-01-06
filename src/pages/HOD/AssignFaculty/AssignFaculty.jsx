import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import HOD_API from '../../../apis/HOD';

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
    semester: course?.semester || '', // Pre-fill with course semester
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

  // Fetch course details - FIXED
  const fetchCourseDetails = async () => {
    try {
      console.log("📘 Fetching course details for ID:", courseId);
      
      // Try to get the specific course first
      try {
        const response = await HOD_API.courses.getCourse(courseId);
        console.log("✅ Course details response:", response.data);
        setCourse(response.data);
      } catch (courseError) {
        console.warn("Could not fetch single course, trying all courses:", courseError);
        
        // Fallback: Get all courses and find the specific one
        const response = await HOD_API.courses.getCourses();
        const courseData = response.data?.find(c => c.id === courseId);
        
        if (courseData) {
          console.log("✅ Found course in list:", courseData);
          setCourse(courseData);
          
          // Pre-fill semester in form if available
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

  // Fetch assignments - FIXED
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
      
      // Handle different response structures
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
      console.error("❌ Error details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Show user-friendly error
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

  // Fetch department faculties - FIXED
  const fetchFaculties = async () => {
    try {
      console.log("👥 Fetching department faculties...");
      const response = await HOD_API.assignments.getDepartmentFaculties();
      console.log("✅ Faculties response:", response.data);
      
      // Handle different response structures
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

  // Fetch available faculties - FIXED
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
      
      // Handle different response structures
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
    
    // Pre-fill with course semester if available
    const semesterToUse = course?.semester ? course.semester.toString() : '';
    
    setFormData({
      facultyId: '',
      semester: semesterToUse,
      year: new Date().getFullYear(),
      teachingMethodology: '',
      assessmentMode: '',
    });
    
    setOpenDialog(true);
    
    // Fetch available faculties if semester is already set
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
      
      // Validation
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
      
      // Refresh data
      fetchAssignments();
      fetchAvailableFaculties();
      
    } catch (error) {
      console.error('❌ Error assigning faculty:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
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
    
    // Get available faculties (assuming you have access to faculties list)
    // Filter out current faculty if you want
    const availableFaculties = faculties.filter(f => f.id !== assignment.facultyId);
    
    // Create a better prompt showing available faculties
    const facultyOptions = availableFaculties
      .map(f => `${f.id}: ${f.name}`)
      .join('\n');
    
    // 1. Ask if user wants to reassign faculty
    const reassignChoice = confirm(
      `Current Faculty: ${assignment.facultyName} (ID: ${assignment.facultyId})\n\n` +
      `Do you want to reassign this course to a different faculty?`
    );
    
    let newFacultyId = null;
    
    if (reassignChoice) {
      // 2. Show available faculties for reassignment
      newFacultyId = prompt(
        `Available Faculties:\n${facultyOptions}\n\n` +
        `Enter Faculty ID to reassign to:`,
        ''
      );
      
      if (newFacultyId === null) return; // User cancelled
      
      if (newFacultyId.trim() === '') {
        newFacultyId = null; // User didn't enter anything
      } else if (newFacultyId === assignment.facultyId) {
        alert("⚠️ That's the same faculty! No change will be made.");
        newFacultyId = null;
      }
    }
    
    // 3. Get teaching methodology
    const newTeachingMethod = prompt(
      'Enter teaching methodology:',
      assignment.teachingMethodology || ''
    );
    
    if (newTeachingMethod === null) return;
    
    // 4. Get assessment mode
    const newAssessmentMode = prompt(
      'Enter assessment mode:',
      assignment.assessmentMode || ''
    );
    
    if (newAssessmentMode === null) return;
    
    // 5. Prepare update data
    const updateData = {
      teachingMethodology: newTeachingMethod,
      assessmentMode: newAssessmentMode,
    };
    
    // Only add newFacultyId if user entered a different one
    if (newFacultyId && newFacultyId !== assignment.facultyId) {
      updateData.newFacultyId = newFacultyId;
    }
    
    console.log("📤 Sending update data:", updateData);
    
    // 6. Call the API
    await HOD_API.assignments.updateAssignment(
      assignment.courseId,
      assignment.facultyId,
      assignment.semester,
      assignment.year,
      updateData
    );
    
    // 7. Show success message
    if (newFacultyId) {
      alert(`✅ Faculty reassigned successfully!\n\n` +
            `Course: ${assignment.courseName}\n` +
            `Old Faculty: ${assignment.facultyName}\n` +
            `New Faculty ID: ${newFacultyId}`);
    } else {
      alert('✅ Assignment details updated successfully!');
    }
    
    // 8. Refresh assignments list
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
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="alert alert-error">
        <h3>Course Not Found</h3>
        <p>The requested course could not be found. Please check the URL or go back to the courses list.</p>
        <button 
          className="btn btn-secondary" 
          onClick={() => window.history.back()}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="assign-faculty-container">
      {/* Header */}
      <div className="header">
        <h1>
          <span className="header-icon">📚</span>
          Faculty Assignment: {course.code} - {course.name}
        </h1>
        
        <p className="subtitle">
          Department: {course.department?.name || course.department?.program?.name || 'N/A'} 
          • Course Type: {course.type || 'N/A'}
          • Credits: {course.credits || 'N/A'}
        </p>
        
        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={handleOpenDialog}
            disabled={loading.assignments}
          >
            <span className="btn-icon">+</span> 
            {loading.assignments ? 'Loading...' : 'Assign New Faculty'}
          </button>
          
          <div className="filters">
            <div className="form-group">
              <label>Semester</label>
              <select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                disabled={loading.assignments}
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    {getSemesterLabel(sem)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Year</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                disabled={loading.assignments}
              >
                {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              className="btn btn-secondary"
              onClick={fetchAssignments}
              disabled={loading.assignments}
            >
              {loading.assignments ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="card">
        <div className="card-header">
          <h2>
            Current Assignments ({assignments.length})
            {loading.assignments && <span className="loading-indicator"> (Loading...)</span>}
          </h2>
        </div>
        
        <div className="card-body">
          {loading.assignments ? (
            <div className="loading-placeholder">
              <p>Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="alert alert-info">
              <h3>No Assignments Found</h3>
              <p>
                No faculty assignments found for {course.code} 
                {filters.semester ? ` in ${getSemesterLabel(filters.semester)}` : ''} 
                {filters.year ? `, ${filters.year}` : ''}.
              </p>
              <p>
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={handleOpenDialog}
                >
                  Click here to assign the first faculty member
                </button>
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Faculty</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Academic Year</th>
                    <th>Teaching Method</th>
                    <th>Assessment Mode</th>
                    <th>Assigned On</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment, index) => (
                    <tr key={`${assignment.facultyId || index}-${assignment.semester}-${assignment.year}`}>
                      <td>
                        <div className="faculty-info">
                          <span className="icon">👤</span>
                          <span>
                            {assignment.faculty?.name || 
                             assignment.facultyName || 
                             `Faculty ${assignment.facultyId?.substring(0, 8) || 'Unknown'}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        {assignment.faculty?.user?.email || 
                         assignment.facultyEmail || 
                         'N/A'}
                      </td>
                      <td>
                        {assignment.faculty?.designation || 'N/A'}
                      </td>
                      <td>
                        <div className="academic-year">
                          <span className="icon">📅</span>
                          <span>
                            {getSemesterLabel(assignment.semester)} • {assignment.year}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={`chip ${assignment.teachingMethodology ? 'chip-primary' : 'chip-default'}`}>
                          {assignment.teachingMethodology || 'Not specified'}
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${assignment.assessmentMode ? 'chip-secondary' : 'chip-default'}`}>
                          {assignment.assessmentMode || 'Not specified'}
                        </span>
                      </td>
                      <td>
                        {assignment.createdAt ? 
                          new Date(assignment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          }) : 
                          'N/A'}
                      </td>
                      <td>
                        <div className="action-buttons">
                          {assignment.faculty && (
                            <button
                              className="btn-icon"
                              title="View Workload"
                              onClick={() => handleViewWorkload(assignment.faculty)}
                            >
                              📋
                            </button>
                          )}
                          <button
                            className="btn-icon"
                            title="Edit Assignment"
                            onClick={() => handleUpdateAssignment(assignment)}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            title="Remove Assignment"
                            onClick={() => handleRemoveAssignment(assignment)}
                          >
                            🗑️
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
      </div>

      {/* Stats Section */}
      <div className="stats-grid">
        <div className="stats-card">
          <div className="stats-header">
            <h3>Department Faculty Overview</h3>
          </div>
          <div className="stats-content">
            <div className="stats-icon">
              <div className="icon-circle">
                {faculties.length}
              </div>
            </div>
            <div className="stats-info">
              <p className="stats-title">Total Faculty</p>
              <p className="stats-subtitle">
                {availableFaculties.length} available for this course
                {formData.semester && formData.year && 
                  ` in ${getSemesterLabel(formData.semester)} ${formData.year}`}
              </p>
            </div>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-header">
            <h3>Course Information</h3>
          </div>
          <div className="course-info">
            <p><strong>Code:</strong> {course.code || 'N/A'}</p>
            <p><strong>Name:</strong> {course.name || 'N/A'}</p>
            <p><strong>Credits:</strong> {course.credits || 'N/A'}</p>
            <p><strong>Semester:</strong> {getSemesterLabel(course.semester)}</p>
            <p><strong>Type:</strong> {course.type || 'N/A'}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge ${course.isActive ? 'active' : 'inactive'}`}>
                {course.isActive ? 'Active' : 'Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Assign Faculty Dialog */}
      {openDialog && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Assign Faculty to Course</h3>
              <button className="modal-close" onClick={handleCloseDialog}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h4>Course: {course.code} - {course.name}</h4>
              </div>
              
              <div className="form-group">
                <label>Academic Year *</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleFormChange}
                  required
                >
                  {[2022, 2023, 2024, 2025, 2026, 2027].map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Semester *</label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleFormChange}
                  required
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      {getSemesterLabel(sem)}
                    </option>
                  ))}
                </select>
                {course.semester && !formData.semester && (
                  <p className="form-help">
                    Course is typically taught in {getSemesterLabel(course.semester)}
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label>Select Faculty *</label>
                <select
                  name="facultyId"
                  value={formData.facultyId}
                  onChange={handleFormChange}
                  required
                  disabled={!formData.semester || !formData.year}
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
                        {faculty.name} • {faculty.designation || 'No designation'} • {faculty.user?.email || 'No email'}
                      </option>
                    ))
                  )}
                </select>
                {formData.semester && formData.year && (
                  <p className="form-help">
                    {availableFaculties.length} faculty member(s) available for {getSemesterLabel(formData.semester)} {formData.year}
                  </p>
                )}
              </div>
              
              <div className="form-group">
                <label>Teaching Methodology (Optional)</label>
                <input
                  type="text"
                  name="teachingMethodology"
                  value={formData.teachingMethodology}
                  onChange={handleFormChange}
                  placeholder="e.g., Lecture-based, Flipped Classroom, Lab Sessions, etc."
                />
              </div>
              
              <div className="form-group">
                <label>Assessment Mode (Optional)</label>
                <input
                  type="text"
                  name="assessmentMode"
                  value={formData.assessmentMode}
                  onChange={handleFormChange}
                  placeholder="e.g., Continuous Assessment, Final Exam, Project-based, etc."
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCloseDialog}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitAssignment}
                disabled={!formData.facultyId || !formData.semester || !formData.year}
              >
                Assign Faculty
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Workload Dialog */}
      {openWorkloadDialog && selectedFaculty && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3>Faculty Workload: {selectedFaculty.name}</h3>
              <button className="modal-close" onClick={() => setOpenWorkloadDialog(false)}>×</button>
            </div>
            <div className="modal-body">
              <FacultyWorkload faculty={selectedFaculty} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setOpenWorkloadDialog(false)}>
                Close
              </button>
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

  if (loading) {
    return (
      <div className="loading-placeholder">
        <p>Loading faculty workload...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <p>{error}</p>
      </div>
    );
  }

  if (!workload) {
    return (
      <div className="alert alert-info">
        <p>No workload data available for this faculty member.</p>
      </div>
    );
  }

  return (
    <div className="workload-container">
      <div className="faculty-info-summary">
        <p><strong>Name:</strong> {workload.faculty?.name || faculty.name}</p>
        <p><strong>Designation:</strong> {workload.faculty?.designation || 'N/A'}</p>
        <p><strong>Department:</strong> {workload.faculty?.department || 'N/A'}</p>
      </div>

      {workload.workloadSummary && workload.workloadSummary.length > 0 ? (
        workload.workloadSummary.map((summary, index) => (
          <div className="workload-card" key={index}>
            <div className="workload-header">
              <h4>
                {summary.year} • {summary.semester === 1 ? 'Semester I' : 'Semester II'}
              </h4>
            </div>
            <div className="workload-body">
              <p>
                <strong>Total Credits:</strong> {summary.totalCredits || 0} • 
                <strong> Courses:</strong> {summary.courseCount || 0}
              </p>
              
              {summary.courses && summary.courses.length > 0 && (
                <div className="course-chips">
                  {summary.courses.map((course, idx) => (
                    <span key={idx} className="chip chip-outline">
                      {course.courseCode} ({course.credits || 0} cr)
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="alert alert-info">
          <p>No workload summary available.</p>
        </div>
      )}

      {workload.assignments && workload.assignments.length > 0 && (
        <div className="workload-table">
          <h4>All Course Assignments</h4>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Course Name</th>
                  <th>Year</th>
                  <th>Semester</th>
                  <th>Credits</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {workload.assignments.map((assignment, index) => (
                  <tr key={index}>
                    <td>{assignment.course?.code || 'N/A'}</td>
                    <td>{assignment.course?.name || 'N/A'}</td>
                    <td>{assignment.year || 'N/A'}</td>
                    <td>{getSemesterLabel(assignment.semester)}</td>
                    <td>{assignment.course?.credits || 'N/A'}</td>
                    <td>{assignment.course?.type || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function for FacultyWorkload component
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

// Add CSS styles
const styles = `
.assign-faculty-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #2c3e50;
}

.header-icon {
  font-size: 28px;
}

.subtitle {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
  margin-top: 20px;
}

.filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-left: auto;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn-primary {
  background-color: #3498db;
  color: white;
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.3);
}

.btn-primary:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #7f8c8d;
  transform: translateY(-1px);
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #34495e;
  font-size: 14px;
}

.form-group select,
.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
  background-color: white;
}

.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
  opacity: 0.7;
}

.form-help {
  font-size: 12px;
  color: #7f8c8d;
  margin-top: 4px;
  font-style: italic;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
}

.card-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.card-body {
  padding: 24px;
}

.loading-indicator {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: normal;
  margin-left: 8px;
}

.loading-placeholder {
  padding: 40px;
  text-align: center;
  color: #7f8c8d;
}

.alert {
  padding: 16px 20px;
  border-radius: 6px;
  margin-bottom: 20px;
  border-left: 4px solid;
}

.alert-info {
  background-color: #e8f4fd;
  border-color: #3498db;
  color: #2c3e50;
}

.alert-error {
  background-color: #fdeaea;
  border-color: #e74c3c;
  color: #c0392b;
}

.alert h3 {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 18px;
}

.table-responsive {
  overflow-x: auto;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th {
  background-color: #f8f9fa;
  padding: 14px 16px;
  text-align: left;
  font-weight: 600;
  color: #2c3e50;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.table td {
  padding: 14px 16px;
  border-bottom: 1px solid #e0e0e0;
  vertical-align: middle;
}

.table tr:hover {
  background-color: #f8f9fa;
}

.table-sm th,
.table-sm td {
  padding: 10px 12px;
  font-size: 13px;
}

.faculty-info,
.academic-year {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon {
  font-size: 16px;
  opacity: 0.7;
}

.chip {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.chip-primary {
  background-color: #e8f4fd;
  color: #2980b9;
  border: 1px solid #b3d7ff;
}

.chip-secondary {
  background-color: #f0e8ff;
  color: #6c3483;
  border: 1px solid #d2b4de;
}

.chip-default {
  background-color: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
}

.chip-outline {
  background-color: transparent;
  border: 1px solid #3498db;
  color: #3498db;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: #7f8c8d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-icon:hover {
  color: #3498db;
  background-color: #f5f5f5;
}

.btn-icon-danger:hover {
  color: #e74c3c;
  background-color: #fdeaea;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
}

.stats-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.stats-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.stats-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.stats-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.icon-circle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  flex-shrink: 0;
}

.stats-info {
  flex: 1;
}

.stats-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.stats-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
}

.course-info {
  display: grid;
  gap: 8px;
}

.course-info p {
  margin: 0;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
}

.course-info strong {
  color: #2c3e50;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.status-badge.active {
  background-color: #d5f4e6;
  color: #27ae60;
}

.status-badge.inactive {
  background-color: #fdeaea;
  color: #e74c3c;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: white;
  border-radius: 8px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-lg {
  max-width: 800px;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8f9fa;
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.modal-close:hover {
  color: #e74c3c;
  background-color: #fdeaea;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.form-section h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 16px;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f8f9fa;
}

.workload-container {
  padding: 4px 0;
}

.faculty-info-summary {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.faculty-info-summary p {
  margin: 6px 0;
  font-size: 14px;
}

.workload-card {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin: 16px 0;
  overflow: hidden;
}

.workload-header {
  padding: 14px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
}

.workload-header h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
}

.workload-body {
  padding: 16px;
}

.workload-body p {
  margin: 0 0 12px 0;
  font-size: 14px;
}

.course-chips {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.workload-table {
  margin-top: 24px;
}

.workload-table h4 {
  font-size: 16px;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 16px;
}

.loading-container .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .assign-faculty-container {
    padding: 16px;
  }
  
  .header h1 {
    font-size: 24px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .filters {
    margin-left: 0;
    width: 100%;
    flex-direction: column;
    gap: 12px;
  }
  
  .filters .form-group {
    width: 100%;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .modal {
    width: 95%;
    margin: 0;
  }
  
  .table-responsive {
    font-size: 13px;
  }
  
  .table th,
  .table td {
    padding: 10px 12px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .stats-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .icon-circle {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .modal-body,
  .modal-header,
  .modal-footer {
    padding: 16px;
  }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default AssignFaculty;