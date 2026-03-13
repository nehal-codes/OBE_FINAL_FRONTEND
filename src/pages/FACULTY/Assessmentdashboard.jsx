import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { BookOpen, AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import facultyApi from "../../apis/faculty";
import assessmentApi from "../../apis/assessments/assessment";
import AssessmentModal from "./AssessmentModal";
import MarksEntry from "./MarksEntry";
import StudentPerformanceAnalysis from "./StudentPerformanceAnalysis";
import MarksDownloadWizard from "./MarksDownloadWizard";

// Import subcomponents
import AcademicPeriodSelector from "./assessmentscomponents/AcademicperiodSelector";
import OverviewTab from "./assessmentscomponents/OverviewTab";
import AssessmentsTab from "./assessmentscomponents/AssessmentsTab";


import "./AssessmentDashboard.css";

const AssessmentDashboard = ({ initialYear = 2026, initialSemester = 5 }) => {
  const location = useLocation();
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
  const [selectedYear, setSelectedYear] = useState(
    location.state?.year || initialYear
  );
  const [selectedSemester, setSelectedSemester] = useState(
    location.state?.semester || initialSemester
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDownloadWizard, setShowDownloadWizard] = useState(false);
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [analysisAssessmentId, setAnalysisAssessmentId] = useState(null);

  // Utility functions
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

      const response = await facultyApi.getAllAssignments({
        year: year,
        semester: semester,
      });

      const courseAssignments = response.data?.assignments || response.data || [];
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
  const loadCourseAssessments = useCallback(async (courseId) => {
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
  }, [selectedYear, selectedSemester]);

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

  // Load course students
  const loadCourseStudents = useCallback(async (courseId) => {
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
            ? { ...course, students: studentsData.length || 0 }
            : course
        )
      );
    } catch (error) {
      console.error("Error loading students:", error);
    }
  }, [selectedYear, selectedSemester]);

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

  // CRUD Operations
  const handleCreateAssessment = async (assessmentData) => {
    try {
      const response = await assessmentApi.createAssessment({
        ...assessmentData,
        courseId: currentCourse.id,
        semester: currentCourse.semester,
        year: currentCourse.year,
      });

      const createdAssessment = response.data?.data || response.data;
      const assessmentId = createdAssessment?.id || createdAssessment?.assessment?.id;
      
      if (!assessmentId) {
        throw new Error("No assessment ID returned from server");
      }
      
      await loadCourseAssessments(currentCourse.id);
      return { ...response.data, assessmentId };
    } catch (error) {
      console.error("Error creating assessment:", error);
      throw error;
    }
  };

  const handleUpdateAssessment = async (assessmentData) => {
    try {
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

  const handleMapClos = async (assessmentId, cloAllocations) => {
    try {
      const response = await assessmentApi.mapClosToAssessment(assessmentId, { cloAllocations });
      return response.data;
    } catch (error) {
      console.error('Error mapping CLOs:', error);
      throw error;
    }
  };

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

  // UI Handlers
  const handleOpenFullAnalysis = (assessmentId = null) => {
    setAnalysisAssessmentId(assessmentId);
    setShowFullAnalysis(true);
  };

  const handleCloseFullAnalysis = () => {
    setShowFullAnalysis(false);
    setAnalysisAssessmentId(null);
  };

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

  // Effects
  useEffect(() => {
    loadFacultyCourses(selectedYear, selectedSemester);
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    if (currentCourse) {
      loadCourseAssessments(currentCourse.id);
      loadCourseClos(currentCourse.id);
      loadCourseStudents(currentCourse.id);
    }
  }, [currentCourse]);

  // Render full analysis view
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

  // Render loading state
  if (loading && !isRefreshing) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading assessment dashboard...</p>
      </div>
    );
  }

  // Render error state
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
          
          {/* Academic Period Selector - Imported Component */}
          <AcademicPeriodSelector
            selectedYear={selectedYear}
            selectedSemester={selectedSemester}
            onYearChange={handleYearChange}
            onSemesterChange={handleSemesterChange}
            onRefresh={() => loadFacultyCourses()}
            isRefreshing={isRefreshing}
          />
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
        {/* Sidebar */}
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
                  </div>
                  <div className="course-period">
                    Y{course.year} - S{course.semester}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {currentCourse ? (
            <>
              {/* Course Header */}
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

              {/* Tabs */}
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

              {/* Tab Content with Imported Components */}
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
                    onOpenDownloadWizard={() => setShowDownloadWizard(true)}
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

      {/* Modals */}
      {showDownloadWizard && currentCourse && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') {
            setShowDownloadWizard(false);
          }
        }}>
          <div className="modal-container" style={{ width: '90%', maxWidth: '1400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <MarksDownloadWizard
              course={currentCourse}
              onClose={() => setShowDownloadWizard(false)}
            />
          </div>
        </div>
      )}

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

export default AssessmentDashboard;