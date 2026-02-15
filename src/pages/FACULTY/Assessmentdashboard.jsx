// src/components/faculty/AssessmentDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import facultyApi from "../../apis/faculty";
import assessmentApi from "../../apis/assessments/assessment";
import AssessmentModal from "./AssessmentModal";
import MarksEntry from "./MarksEntry";
import StudentPerformanceAnalysis from "./StudentPerformanceAnalysis";
import {
  BookOpen,
  Award,
  FileText,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  ChevronDown,
  BarChart,
  ArrowLeft
} from "lucide-react";
import "./AssessmentDashboard.css";

const AssessmentDashboard = ({ initialYear = 2026, initialSemester = 5 }) => {
  const [courses, setCourses] = useState([]);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [courseClos, setCourseClos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [marksSummary, setMarksSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [showModal, setShowModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedSemester, setSelectedSemester] = useState(initialSemester);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // NEW: State for full-screen performance analysis
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [analysisAssessmentId, setAnalysisAssessmentId] = useState(null);

  // Year and semester options
  const yearOptions = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);
  const semesterOptions = [
    { value: 1, label: "Semester 1" },
    { value: 2, label: "Semester 2" },
    { value: 3, label: "Semester 3" },
    { value: 4, label: "Semester 4" },
    { value: 5, label: "Semester 5" },
    { value: 6, label: "Semester 6" },
    { value: 7, label: "Semester 7" },
    { value: 8, label: "Semester 8" },
  ];

  // Safe array functions
  const safeArray = (arr) => (Array.isArray(arr) ? arr : []);
  const safeReduce = (arr, callback, initialValue) =>
    Array.isArray(arr) ? arr.reduce(callback, initialValue) : initialValue;
  const safeFilter = (arr, callback) =>
    Array.isArray(arr) ? arr.filter(callback) : [];
  const safeMap = (arr, callback) =>
    Array.isArray(arr) ? arr.map(callback) : [];

  // Load faculty courses
  const loadFacultyCourses = useCallback(async (year = selectedYear, semester = selectedSemester) => {
    try {
      setLoading(true);
      setApiError(null);
      console.log(`Loading faculty courses for Year: ${year}, Semester: ${semester}...`);

      const response = await facultyApi.getAllAssignments({
        year: year,
        semester: semester,
      });

      console.log("Faculty API Response:", response);

      const courseAssignments =
        response.data?.assignments || response.data || [];

      setAssignments(courseAssignments);

      const uniqueCourses = safeReduce(
        courseAssignments,
        (acc, assignment) => {
          const courseData = assignment.course || assignment;
          if (!acc.find((c) => c.id === courseData.id)) {
            acc.push({
              id: courseData.id,
              code: courseData.code,
              name: courseData.name,
              credits: courseData.credits || 0,
              semester: assignment.semester || semester,
              year: assignment.year || year,
              type: courseData.type || "THEORY",
              status: "inprogress",
              students: 0,
            });
          }
          return acc;
        },
        []
      );

      setCourses(uniqueCourses);

      if (uniqueCourses.length > 0 && !currentCourse) {
        setCurrentCourse(uniqueCourses[0]);
      } else if (currentCourse && uniqueCourses.length > 0) {
        // Try to keep the same course selected if it exists in new list
        const existingCourse = uniqueCourses.find(c => c.id === currentCourse.id);
        if (existingCourse) {
          setCurrentCourse({
            ...existingCourse,
            semester: semester,
            year: year,
          });
        } else {
          setCurrentCourse(uniqueCourses[0]);
        }
      }
    } catch (error) {
      console.error("Error loading courses:", error);
      setApiError(error.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentCourse, selectedYear, selectedSemester]);

  // Load course assessments
  const loadCourseAssessments = useCallback(
    async (courseId) => {
      if (!courseId) return;

      try {
        const response = await assessmentApi.getCourseAssessments(courseId, {
          semester: selectedSemester,
          year: selectedYear,
        });

        const assessmentsData = response.data?.data?.assessments || [];
        setAssessments(assessmentsData);
        setMarksSummary(response.data?.data?.marksSummary);
      } catch (error) {
        console.error("Error loading assessments:", error);
        setAssessments([]);
      }
    },
    [selectedYear, selectedSemester]
  );

  // Load course CLOs
  const loadCourseClos = useCallback(async (courseId) => {
    if (!courseId) return;

    try {
      const response = await assessmentApi.getCourseClos(courseId);
      const closData = response.data?.data || [];
      setCourseClos(closData);
    } catch (error) {
      console.error("Error loading CLOs:", error);
      setCourseClos([]);
    }
  }, []);

  // Load course students count
  const loadCourseStudents = useCallback(
    async (courseId) => {
      if (!courseId) return;

      try {
        const response = await assessmentApi.getCourseStudents(courseId, {
          semester: selectedSemester,
          year: selectedYear,
        });

        const studentsData = response.data?.students || [];

        setCourses((prev) =>
          safeMap(prev, (course) =>
            course.id === courseId
              ? {
                  ...course,
                  students: studentsData.length || 0,
                }
              : course
          )
        );
      } catch (error) {
        console.error("Error loading students:", error);
      }
    },
    [selectedYear, selectedSemester]
  );

  // Calculate marks remaining
  const calculateMarksRemaining = () => {
    const maxMarks = (currentCourse?.credits || 0) * 25;
    const usedMarks = safeReduce(
      assessments,
      (sum, a) => sum + (a.maxMarks || 0),
      0
    );
    
    if (editingAssessment) {
      const editingMarks = editingAssessment.maxMarks || 0;
      return maxMarks - usedMarks + editingMarks;
    }
    
    return maxMarks - usedMarks;
  };

  // Calculate stats
  const calculateStats = () => {
    const safeAssessments = safeArray(assessments);
    const assessmentsCount = safeAssessments.length;
    const marksUsed = safeReduce(
      safeAssessments,
      (sum, a) => sum + (a.maxMarks || 0),
      0
    );
    const maxMarks = (currentCourse?.credits || 0) * 25;
    const marksPercentage =
      maxMarks > 0 ? Math.round((marksUsed / maxMarks) * 100) : 0;

    const enteredAssessments = safeFilter(
      safeAssessments,
      (a) => a._count?.marks > 0 || a.marksCount > 0
    ).length;
    const enteredPercentage =
      assessmentsCount > 0
        ? Math.round((enteredAssessments / assessmentsCount) * 100)
        : 0;

    return {
      assessmentsCount,
      marksUsed,
      maxMarks,
      marksPercentage,
      enteredAssessments,
      enteredPercentage,
      marksRemaining: maxMarks - marksUsed,
    };
  };

  const stats = calculateStats();

  // Create new assessment
  const handleCreateAssessment = async (assessmentData) => {
    try {
      console.log("Creating assessment:", assessmentData);

      const response = await assessmentApi.createAssessment({
        ...assessmentData,
        courseId: currentCourse.id,
        semester: currentCourse.semester,
        year: currentCourse.year,
      });

      // Get the created assessment ID
      const createdAssessment = response.data?.data || response.data;
      const assessmentId = createdAssessment?.id || createdAssessment?.assessment?.id;
      
      if (!assessmentId) {
        throw new Error("No assessment ID returned from server");
      }
      
      console.log("Assessment created with ID:", assessmentId);
      
      // Refresh the assessments list
      await loadCourseAssessments(currentCourse.id);
      
      // Return the ID for CLO mapping
      return { ...response.data, assessmentId };
      
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw error;
    }
  };

  // Update existing assessment
  const handleUpdateAssessment = async (assessmentData) => {
    try {
      console.log("Updating assessment:", assessmentData);

      await assessmentApi.updateAssessment(assessmentData.id, assessmentData);
      await loadCourseAssessments(currentCourse.id);
      setShowModal(false);
      setEditingAssessment(null);

      showAlert("Assessment updated successfully!", "success");
    } catch (error) {
      console.error("Error updating assessment:", error);
      showAlert(
        error.response?.data?.message || "Failed to update assessment",
        "error"
      );
    }
  };

  // Map CLOs to assessment
  const handleMapClos = async (assessmentId, cloAllocations) => {
    try {
      const response = await assessmentApi.mapClosToAssessment(assessmentId, { cloAllocations });
      console.log('CLOs mapped:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error mapping CLOs:', error);
      throw error;
    }
  };

  // Delete assessment
  const handleDeleteAssessment = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this assessment?"))
      return;

    try {
      await assessmentApi.deleteAssessment(assessmentId);
      await loadCourseAssessments(currentCourse.id);
      showAlert("Assessment deleted successfully!", "success");
    } catch (error) {
      console.error("Error deleting assessment:", error);
      showAlert(
        error.response?.data?.message || "Failed to delete assessment",
        "error"
      );
    }
  };

  // Handle marks entry
  const handleEnterMarks = async (assessmentId, marksEntries) => {
    try {
      
      console.log("Would save marks for:", assessmentId, marksEntries);
      showAlert("Marks saved successfully!", "success");
    } catch (error) {
      console.error("Error saving marks:", error);
      showAlert(
        error.response?.data?.message || "Failed to save marks",
        "error"
      );
    }
  };

  // NEW: Handle full-screen performance analysis
  const handleOpenFullAnalysis = (assessmentId = null) => {
    setAnalysisAssessmentId(assessmentId);
    setShowFullAnalysis(true);
  };

  const handleCloseFullAnalysis = () => {
    setShowFullAnalysis(false);
    setAnalysisAssessmentId(null);
  };

  // Handle year/semester change
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setIsRefreshing(true);
    loadFacultyCourses(year, selectedSemester);
  };

  const handleSemesterChange = (semester) => {
    setSelectedSemester(semester);
    setIsRefreshing(true);
    loadFacultyCourses(selectedYear, semester);
  };

  const showAlert = (message, type = "success") => {
    const alertElement = document.createElement("div");
    alertElement.className = `alert alert-${type}`;
    alertElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      padding: 15px;
      border-radius: 8px;
      background: ${type === "success" ? "#d4edda" : type === "error" ? "#f8d7da" : "#fff3cd"};
      color: ${type === "success" ? "#155724" : type === "error" ? "#721c24" : "#856404"};
      border-left: 4px solid ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#ffc107"};
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;

    alertElement.innerHTML = `
      <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}" 
         style="font-size: 20px;"></i>
      <span>${message}</span>
    `;

    document.body.appendChild(alertElement);
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.remove();
      }
    }, 5000);
  };

  useEffect(() => {
    loadFacultyCourses(selectedYear, selectedSemester);
  }, []);

  useEffect(() => {
    if (currentCourse) {
      loadCourseAssessments(currentCourse.id);
      loadCourseClos(currentCourse.id);
      loadCourseStudents(currentCourse.id);
    }
  }, [currentCourse, loadCourseAssessments, loadCourseClos, loadCourseStudents]);

  // If showing full analysis, render only the analysis component
  if (showFullAnalysis && currentCourse) {
    return (
      <div className="full-analysis-container">
        <div className="analysis-header">
          <button 
            className="btn-back"
            onClick={handleCloseFullAnalysis}
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h2>Student Performance Analysis</h2>
          <div className="analysis-course-info">
            {currentCourse.code} - {currentCourse.name}
          </div>
        </div>
        <StudentPerformanceAnalysis
          course={currentCourse}
          assessmentId={analysisAssessmentId}
          assessments={assessments}
          onClose={handleCloseFullAnalysis}
          standalone={true}
          showHeader={false}
        />
      </div>
    );
  }

  if (loading && !isRefreshing) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading assessment dashboard...</p>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} className="error-icon" />
        <h3>Error Loading Dashboard</h3>
        <p className="error-message">{apiError}</p>
        <button className="btn btn-primary" onClick={() => loadFacultyCourses()}>
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="assessment-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <i className="fas fa-chalkboard-teacher"></i> Faculty Assessment Management
          </h1>
          <div className="academic-period-selector">
            <div className="selector-group">
              <label htmlFor="year-select">
                <Calendar size={14} /> Academic Year
              </label>
              <div className="select-wrapper">
                <select 
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  disabled={isRefreshing}
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-arrow" />
              </div>
            </div>
            
            <div className="selector-group">
              <label htmlFor="semester-select">Semester</label>
              <div className="select-wrapper">
                <select 
                  id="semester-select"
                  value={selectedSemester}
                  onChange={(e) => handleSemesterChange(parseInt(e.target.value))}
                  disabled={isRefreshing}
                >
                  {semesterOptions.map(sem => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="select-arrow" />
              </div>
            </div>
            
            <button 
              className="btn-refresh" 
              onClick={() => loadFacultyCourses()}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={isRefreshing ? "spinning" : ""} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
        
        <div className="faculty-info">
          <div>
            <div className="faculty-name">Faculty Dashboard</div>
            <div className="faculty-dept">Assessment Management</div>
          </div>
          <div className="faculty-avatar">FD</div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>My Courses ({courses.length})</h3>
            <div className="academic-period-info">
              <span className="period-badge">
                {selectedYear} - S{selectedSemester}
              </span>
            </div>
          </div>
          <ul className="course-list">
            {courses.length === 0 ? (
              <div className="no-courses">
                <BookOpen size={32} />
                <p>No courses assigned for {selectedYear} - Semester {selectedSemester}</p>
                <p className="hint-text">Try changing the year or semester</p>
              </div>
            ) : (
              safeMap(courses, (course) => (
                <li
                  key={course.id}
                  className={`course-item ${currentCourse?.id === course.id ? "active" : ""}`}
                  onClick={() => setCurrentCourse(course)}
                >
                  <div className="course-code">{course.code}</div>
                  <div className="course-name">{course.name}</div>
                  <div className="course-meta">
                    <span>Credits: {course.credits}</span>
                    <span>Students: {course.students || 0}</span>
                  </div>
                  <div className="course-period">
                    Y{currentCourse?.year} - S{currentCourse?.semester}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="main-content">
          {currentCourse ? (
            <>
              <div className="course-header">
                <div>
                  <h2>{currentCourse.name}</h2>
                  <div className="course-subtitle">
                    <span className="course-code-badge">{currentCourse.code}</span>
                    <span>{currentCourse.credits} Credits</span>
                    <span className={`course-type ${currentCourse.type?.toLowerCase()}`}>
                      {currentCourse.type || "THEORY"}
                    </span>
                    <span className="academic-period-badge">
                      Academic Period: {currentCourse.year} - Semester {currentCourse.semester}
                    </span>
                  </div>
                </div>
                <div className="course-stats">
                  <div className="stat-box">
                    <div className="stat-value">{currentCourse.students || 0}</div>
                    <div className="stat-label">Students</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">{courseClos.length}</div>
                    <div className="stat-label">CLOs</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-value">
                      {stats.marksUsed}/{stats.maxMarks}
                    </div>
                    <div className="stat-label">Marks Used</div>
                  </div>
                </div>
              </div>

              <div className="tabs">
                <button
                  className={`tab ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  Overview
                </button>
                <button
                  className={`tab ${activeTab === "assessments" ? "active" : ""}`}
                  onClick={() => setActiveTab("assessments")}
                >
                  Assessments
                </button>
                <button
                  className={`tab ${activeTab === "marks" ? "active" : ""}`}
                  onClick={() => setActiveTab("marks")}
                >
                  Marks Entry
                </button>
              </div>

              <div className="tab-content">
                {activeTab === "overview" && (
                  <OverviewTab
                    course={currentCourse}
                    clos={courseClos}
                    stats={stats}
                    assessments={assessments}
                    onAnalyzeAll={() => handleOpenFullAnalysis(null)}
                  />
                )}

                {activeTab === "assessments" && (
                  <AssessmentsTab
                    assessments={assessments}
                    marksSummary={marksSummary}
                    course={currentCourse}
                    onOpenModal={() => {
                      setEditingAssessment(null);
                      setShowModal(true);
                    }}
                    onEditAssessment={(assessment) => {
                      setEditingAssessment(assessment);
                      setShowModal(true);
                    }}
                    onDeleteAssessment={handleDeleteAssessment}
                    onViewMarks={(assessment) => {
                      setSelectedAssessment(assessment);
                      setActiveTab("marks");
                    }}
                    onAnalyzeAssessment={(assessmentId) => handleOpenFullAnalysis(assessmentId)}
                  />
                )}

                {activeTab === "marks" && (
                  <MarksEntry
                    assessments={assessments}
                    selectedAssessment={selectedAssessment}
                    course={currentCourse}
                    onSelectAssessment={setSelectedAssessment}
                    onEnterMarks={handleEnterMarks}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="no-course">
              <BookOpen className="icon" />
              <h3>No Course Selected</h3>
              <p>Select a course from the sidebar to get started</p>
              <div className="academic-period-hint">
                <Calendar size={20} />
                <span>Currently viewing: {selectedYear} - Semester {selectedSemester}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && currentCourse && (
        <AssessmentModal
          course={currentCourse}
          clos={courseClos}
          assessment={editingAssessment}
          marksRemaining={calculateMarksRemaining()}
          onClose={() => {
            setShowModal(false);
            setEditingAssessment(null);
          }}
          onSubmit={editingAssessment ? handleUpdateAssessment : handleCreateAssessment}
          onMapClos={handleMapClos}
          existingAssessments={assessments} 
        />
      )}
    </div>
  );
};

// Updated OverviewTab with analyze all button
const OverviewTab = ({ course, clos, stats, assessments, onAnalyzeAll }) => {
  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const finalizedCount = safeAssessments.filter(a => a.isMarksFinalized).length;

  return (
    <div className="overview-tab">
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Course CLOs</h4>
          <div className="summary-value">{clos.length}</div>
          <div className="summary-subtext">All mapped to POs/PSOs</div>
        </div>

        <div className="summary-card">
          <h4>Assessments Created</h4>
          <div className="summary-value">{stats.assessmentsCount}</div>
          <div className="summary-subtext">Total assessments</div>
        </div>

        <div className="summary-card">
          <h4>Marks Allocation</h4>
          <div className="summary-value">{stats.marksPercentage}%</div>
          <div className="summary-subtext">
            {stats.marksUsed} of {stats.maxMarks} marks used
          </div>
        </div>

        <div className="summary-card analysis-card">
          <h4>Performance Analysis</h4>
          <div className="summary-value">{finalizedCount}</div>
          <div className="summary-subtext">Assessments finalized</div>
          {finalizedCount > 0 && (
            <button 
              className="btn-analyze"
              onClick={onAnalyzeAll}
            >
              <BarChart size={14} /> Analyze All
            </button>
          )}
        </div>
      </div>

      <div className="clos-section">
        <h3>Course CLOs</h3>
        {clos.length === 0 ? (
          <div className="no-clos">
            <Award size={48} />
            <p>No CLOs defined for this course</p>
          </div>
        ) : (
          <div className="clos-table">
            <table>
              <thead>
                <tr>
                  <th>CLO Code</th>
                  <th>Statement</th>
                  <th>Bloom Level</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo, index) => (
                  <tr key={clo.id || index}>
                    <td><strong>{clo.code}</strong></td>
                    <td>{clo.statement || "No description"}</td>
                    <td>
                      <span className={`bloom-level ${(clo.bloomLevel || "").toLowerCase()}`}>
                        {clo.bloomLevel || "N/A"}
                      </span>
                    </td>
                    <td>{clo.attainmentThreshold || 50}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Updated AssessmentsTab with analyze button
const AssessmentsTab = ({
  assessments,
  course,
  onOpenModal,
  onEditAssessment,
  onDeleteAssessment,
  onViewMarks,
  onAnalyzeAssessment,
}) => {
  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const maxMarks = (course?.credits || 0) * 25;
  const usedMarks = safeAssessments.reduce(
    (sum, a) => sum + (a.maxMarks || 0),
    0
  );
  const remaining = maxMarks - usedMarks;

  return (
    <div className="assessments-tab">
      <div className="section-title">
        <h3>Course Assessments</h3>
        <button className="btn btn-primary" onClick={onOpenModal}>
          <Plus size={16} /> Create Assessment
        </button>
      </div>

      <div className={`alert ${remaining <= 0 ? "alert-danger" : "alert-warning"}`}>
        <AlertCircle size={20} />
        <div className="alert-content">
          <strong>Note:</strong> Total marks for all assessments cannot exceed 25 × credits ={" "}
          <strong>{maxMarks}</strong> marks.
          {remaining <= 0 && " All marks have been allocated!"}
        </div>
      </div>

      <div className="assessments-list">
        {safeAssessments.length === 0 ? (
          <div className="no-assessments">
            <FileText size={48} />
            <h4>No Assessments Created</h4>
            <p>Create your first assessment to get started.</p>
          </div>
        ) : (
          safeAssessments.map((assessment, index) => (
            <div
              key={assessment.id || `assessment-${index}`}
              className={`assessment-card ${assessment.type || "theory"} ${assessment.isMarksFinalized ? 'finalized' : ''}`}
            >
              <div className="assessment-header">
                <div className="assessment-title">
                  {assessment.title || `Assessment ${index + 1}`}
                  {assessment.isMarksFinalized && (
                    <span className="finalized-badge-small">Finalized</span>
                  )}
                </div>
                <span className={`assessment-type type-${assessment.type || "theory"}`}>
                  {(assessment.type || "theory").charAt(0).toUpperCase() +
                    (assessment.type || "theory").slice(1)}
                </span>
              </div>
              <div className="assessment-details">
                <div className="detail-row">
                  <span className="detail-label">Mode:</span>
                  <span className="detail-value">{assessment.mode || "Written"}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Max Marks:</span>
                  <span className="detail-value">{assessment.maxMarks || 0}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Scheduled:</span>
                  <span className="detail-value">
                    {assessment.scheduledDate
                      ? new Date(assessment.scheduledDate).toLocaleDateString()
                      : "Not scheduled"}
                  </span>
                </div>
              </div>

              {assessment.assessmentClos && assessment.assessmentClos.length > 0 && (
                <div className="clo-tags">
                  {assessment.assessmentClos.map((ac, idx) => (
                    <span key={idx} className="clo-tag">
                      {ac.clo?.code || "CLO"} ({ac.marksAllocated || 0}m)
                    </span>
                  ))}
                </div>
              )}

              <div className="assessment-actions">
                <button
                  className="btn btn-outline"
                  onClick={() => onEditAssessment(assessment)}
                  disabled={assessment.isMarksFinalized}
                >
                  <Edit size={14} /> Edit
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => onViewMarks(assessment)}
                >
                  <FileText size={14} />
                  {assessment._count?.marks > 0 || assessment.marksCount > 0
                    ? "View Marks"
                    : "Enter Marks"}
                </button>
                
                {assessment.isMarksFinalized && (
                  <button
                    className="btn btn-outline btn-analyze"
                    onClick={() => onAnalyzeAssessment(assessment.id)}
                    title="Analyze student performance"
                  >
                    <BarChart size={14} /> Analyze
                  </button>
                )}
                
                {!(assessment._count?.marks > 0 || assessment.marksCount > 0) && !assessment.isMarksFinalized && (
                  <button
                    className="btn btn-outline btn-danger"
                    onClick={() => onDeleteAssessment(assessment.id)}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Add CSS styles for full analysis view
const styles = `
.full-analysis-container {
  min-height: 100vh;
  background: #f8f9fa;
}

.analysis-header {
  background: white;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  gap: 2rem;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.analysis-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
  flex: 1;
}

.analysis-course-info {
  color: #6c757d;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border-radius: 20px;
  border: 1px solid #e9ecef;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  color: #495057;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #f8f9fa;
  border-color: #adb5bd;
  color: #212529;
}

@media (max-width: 768px) {
  .analysis-header {
    padding: 1rem;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  .analysis-header h2 {
    font-size: 1.25rem;
    order: 3;
    width: 100%;
  }
  
  .analysis-course-info {
    order: 2;
  }
  
  .btn-back {
    order: 1;
  }
}
`;

// Inject styles
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

export default AssessmentDashboard;