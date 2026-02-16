// src/components/faculty/MarksEntry.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Save, 
  Search, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Lock, 
  LockOpen, 
  Info,
  AlertTriangle
} from 'lucide-react';
import assessmentApi from "../../apis/assessments/assessment";

const MarksEntry = ({ 
  assessments, 
  selectedAssessment: initialSelected, 
  course, 
  onSelectAssessment, 
  onEnterMarks 
}) => {
  const [selectedAssessment, setSelectedAssessment] = useState(initialSelected);
  const [students, setStudents] = useState([]);
  const [marksData, setMarksData] = useState({});
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marksLoading, setMarksLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [assessmentStats, setAssessmentStats] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // NEW STATES for finalization
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationStatus, setFinalizationStatus] = useState(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);
  
  // Refs to track previous values
  const prevCourseRef = useRef(null);
  const prevAssessmentRef = useRef(null);

  // Safe function to get data from response
  const getResponseData = (response) => {
    if (response?.data?.data) {
      return response.data.data;
    }
    if (response?.data) {
      return response.data;
    }
    return response;
  };

  // ========== NEW FUNCTIONS FOR FINALIZATION ==========
  
  // Check finalization status for selected assessment
  const checkFinalizationStatus = useCallback(async (assessmentId) => {
    if (!assessmentId) return;
    
    try {
      console.log('[DEBUG] Checking finalization status for assessment:', assessmentId);
      const response = await assessmentApi.getAssessmentFinalizationStatus(assessmentId);
      console.log('[DEBUG] Finalization status response:', response);
      
      const statusData = getResponseData(response);
      setFinalizationStatus(statusData?.data || statusData);
      
      return statusData;
    } catch (error) {
      console.error('[DEBUG] Error checking finalization status:', error);
      setFinalizationStatus(null);
      return null;
    }
  }, []);

  // Finalize marks for assessment
  const handleFinalizeMarks = useCallback(async () => {
    if (!selectedAssessment) {
      alert('Please select an assessment first');
      return;
    }
    
    if (!window.confirm('Are you sure you want to finalize marks?\n\n⚠️ Once finalized, marks cannot be modified or altered in any way.')) {
      return;
    }
    
    try {
      setIsFinalizing(true);
      console.log('[DEBUG] Finalizing marks for assessment:', selectedAssessment.id);
      
      const response = await assessmentApi.finalizeAssessmentMarks(selectedAssessment.id);
      console.log('[DEBUG] Finalization response:', response);
      
      const responseData = getResponseData(response);
      
      if (responseData?.success) {
        // Update local state and refresh status
        await checkFinalizationStatus(selectedAssessment.id);
        
        // Show success message
        showNotification('✅ Marks finalized successfully! Marks are now locked and cannot be modified.', 'success');
      } else {
        alert(`Failed to finalize marks: ${responseData?.message || 'Unknown error'}`);
        showNotification(`❌ ${responseData?.message || 'Failed to finalize marks'}`, 'error');
      }
    } catch (error) {
      console.error('[DEBUG] Error finalizing marks:', error);
      const errorMsg = error.response?.data?.message || error.message;
      alert(`Error finalizing marks: ${errorMsg}`);
      showNotification(`❌ Error: ${errorMsg}`, 'error');
    } finally {
      setIsFinalizing(false);
      setShowFinalizationModal(false);
    }
  }, [selectedAssessment, checkFinalizationStatus]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `finalization-notification notification-${type}`;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span>${message}</span>
      </div>
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
      max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  };
  
  // ========== EXISTING FUNCTIONS (UPDATED) ==========
  
  // Initialize component on mount
  const initializeComponent = useCallback(async () => {
    console.log('Initializing MarksEntry component...');
    
    if (!course) {
      console.log('No course provided, skipping initialization');
      setInitialized(true);
      return;
    }
    
    try {
      setLoading(true);
      setHasError(false);
      
      console.log('Loading students for course:', course.id, 'semester:', course.semester, 'year:', course.year);
      
      // 1. Load students first
      const studentsResponse = await assessmentApi.getCourseStudents(course.id, {
        semester: course.semester,
        year: course.year
      });
      
      const studentsData = getResponseData(studentsResponse)?.students || [];
      console.log('Loaded students:', studentsData.length);
      setStudents(studentsData);
      
      // 2. Auto-select first assessment if available
      let selectedAssess = selectedAssessment;
      if (!selectedAssess && assessments?.length > 0) {
        selectedAssess = assessments[0];
        console.log('Auto-selecting first assessment:', selectedAssess);
        setSelectedAssessment(selectedAssess);
        if (onSelectAssessment) {
          onSelectAssessment(selectedAssess);
        }
      }
      
      // 3. If we have an assessment and students, load marks AND check finalization status
      if (selectedAssess && studentsData.length > 0) {
        console.log('Loading marks for selected assessment:', selectedAssess.id);
        await loadExistingMarks(selectedAssess, studentsData);
        
        // NEW: Check finalization status
        await checkFinalizationStatus(selectedAssess.id);
      } else if (selectedAssess) {
        // Initialize empty marks structure
        const initialMarks = {};
        studentsData.forEach(student => {
          initialMarks[student.id] = {};
          selectedAssess.assessmentClos?.forEach(ac => {
            initialMarks[student.id][ac.cloId] = 0;
          });
        });
        setMarksData(initialMarks);
        console.log('Initialized empty marks data for', studentsData.length, 'students');
        
        // NEW: Check finalization status even if no marks
        await checkFinalizationStatus(selectedAssess.id);
      }
      
      setInitialized(true);
      
    } catch (error) {
      console.error('Error initializing MarksEntry:', error);
      setHasError(true);
      alert(`Failed to initialize: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      console.log('Initialization completed');
    }
  }, [course, assessments, selectedAssessment, onSelectAssessment, checkFinalizationStatus]);

  // Load existing marks for selected assessment
  const loadExistingMarks = useCallback(async (selectedAssess, studentList) => {
    if (!selectedAssess) {
      console.log('No assessment selected for loadExistingMarks');
      return;
    }
    
    try {
      console.log("Loading marks for assessment:", selectedAssess.id);
      setMarksLoading(true);
      
      const response = await assessmentApi.getAssessmentMarks(selectedAssess.id);
      console.log("Assessment marks raw response:", response);
      
      const responseData = getResponseData(response);
      console.log("Extracted marks data:", responseData);
      
      if (!responseData) {
        throw new Error('No data received from server');
      }
      
      // Extract statistics
      const stats = responseData?.statistics || {};
      console.log("Assessment statistics:", stats);
      setAssessmentStats(stats);
      
      // Get CLOs data from response
      const closFromResponse = responseData?.clos || [];
      console.log("CLOs from response:", closFromResponse);
      
      // Initialize new marks data
      const newMarksData = {};
      
      // Check if we have marks in the response
      const studentsData = responseData?.students || [];
      console.log("Students marks data:", studentsData.length);
      
      if (studentsData.length > 0) {
        // Process existing marks from response
        studentsData.forEach(studentMark => {
          const studentId = studentMark.studentId;
          if (!studentId) {
            console.warn('Student mark entry without studentId:', studentMark);
            return;
          }
          
          // Initialize student entry if not exists
          if (!newMarksData[studentId]) {
            newMarksData[studentId] = {};
          }
          
          // Process marksByClo object
          if (studentMark.marksByClo) {
            Object.entries(studentMark.marksByClo).forEach(([cloId, cloData]) => {
              if (cloData && typeof cloData === 'object' && cloData.marksObtained !== undefined) {
                newMarksData[studentId][cloId] = parseFloat(cloData.marksObtained) || 0;
              }
            });
          }
          
          // Also check for marksEntries array (for backward compatibility)
          if (studentMark.marksEntries) {
            studentMark.marksEntries.forEach(entry => {
              if (entry.cloId && entry.marksObtained !== undefined) {
                newMarksData[studentId][entry.cloId] = parseFloat(entry.marksObtained) || 0;
              }
            });
          }
        });
      }
      
      // Initialize any remaining students with 0 marks
      studentList.forEach(student => {
        if (!newMarksData[student.id]) {
          newMarksData[student.id] = {};
        }
        
        // Use CLOs from response or from selectedAssessment
        const closToUse = closFromResponse.length > 0 ? closFromResponse : selectedAssess.assessmentClos;
        
        closToUse?.forEach(clo => {
          const cloId = clo.id || clo.cloId;
          if (cloId && newMarksData[student.id][cloId] === undefined) {
            newMarksData[student.id][cloId] = 0;
          }
        });
      });
      
      console.log("Final marks data structure:", newMarksData);
      setMarksData(newMarksData);
      
    } catch (error) {
      console.error('Error loading marks:', error);
      
      // If marks endpoint returns error, just initialize with zeros
      console.log('Error loading marks, initializing with zeros');
      const newMarksData = {};
      
      studentList.forEach(student => {
        newMarksData[student.id] = {};
        
        // Use assessment CLOs from the assessment object
        selectedAssess.assessmentClos?.forEach(ac => {
          const cloId = ac.cloId;
          newMarksData[student.id][cloId] = 0;
        });
      });
      
      setMarksData(newMarksData);
    } finally {
      setMarksLoading(false);
      console.log('loadExistingMarks completed');
    }
  }, []);

  // Load students separately (for retry)
  const loadStudents = useCallback(async () => {
    if (!course) {
      console.log('No course provided to loadStudents');
      return;
    }
    
    try {
      console.log('Loading students for course:', course.id);
      setLoading(true);
      setHasError(false);
      
      const response = await assessmentApi.getCourseStudents(course.id, {
        semester: course.semester,
        year: course.year
      });
      
      const studentsData = getResponseData(response)?.students || [];
      console.log("Loaded students:", studentsData.length);
      
      setStudents(studentsData);
      
      // If we have a selected assessment, load marks for it
      if (selectedAssessment && studentsData.length > 0) {
        await loadExistingMarks(selectedAssessment, studentsData);
      }
      
      return studentsData;
    } catch (error) {
      console.error('Error loading students:', error);
      setHasError(true);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [course, selectedAssessment, loadExistingMarks]);

  // Handle assessment selection
  const handleAssessmentSelect = useCallback(async (assessment) => {
    console.log('Assessment selected:', assessment);
    setSelectedAssessment(assessment);
    if (onSelectAssessment) {
      onSelectAssessment(assessment);
    }
    
    // Reset states when assessment changes
    setMarksData({});
    setAssessmentStats(null);
    setValidationErrors({});
    setFinalizationStatus(null);
    
    // Load marks and check finalization status for the new assessment
    if (assessment && students.length > 0) {
      await Promise.all([
        loadExistingMarks(assessment, students),
        checkFinalizationStatus(assessment.id)
      ]);
    } else if (assessment) {
      // Initialize empty marks structure
      const initialMarks = {};
      students.forEach(student => {
        initialMarks[student.id] = {};
        assessment.assessmentClos?.forEach(ac => {
          initialMarks[student.id][ac.cloId] = 0;
        });
      });
      setMarksData(initialMarks);
      
      // Check finalization status
      await checkFinalizationStatus(assessment.id);
    }
  }, [students, onSelectAssessment, loadExistingMarks, checkFinalizationStatus]);

  // Handle marks change
  const handleMarksChange = useCallback((studentId, cloId, value) => {
    // Check if marks are finalized
    if (finalizationStatus?.assessment?.isMarksFinalized) {
      alert('❌ Marks are finalized and cannot be modified.');
      return;
    }
    
    const numValue = parseFloat(value) || 0;
    
    setMarksData(prev => {
      const newMarksData = { ...prev };
      
      if (!newMarksData[studentId]) {
        newMarksData[studentId] = {};
      }
      
      newMarksData[studentId][cloId] = numValue;
      return newMarksData;
    });
    
    // Clear validation error for this field
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${studentId}-${cloId}`];
      return newErrors;
    });
  }, [finalizationStatus]);

  // Calculate student total
  const calculateStudentTotal = useCallback((studentId) => {
    if (!selectedAssessment || !marksData[studentId]) return 0;
    
    let total = 0;
    selectedAssessment.assessmentClos?.forEach(ac => {
      total += marksData[studentId][ac.cloId] || 0;
    });
    return total;
  }, [selectedAssessment, marksData]);

  // Calculate CLO max marks
  const calculateCloMaxMarks = useCallback((cloId) => {
    if (!selectedAssessment) return 0;
    
    // First try to find in assessmentClos array
    const allocation = selectedAssessment.assessmentClos?.find(ac => ac.cloId === cloId);
    if (allocation) {
      return allocation.marksAllocated || 0;
    }
    
    // If not found, check if assessmentClos is an object instead of array
    if (selectedAssessment.assessmentClos && typeof selectedAssessment.assessmentClos === 'object') {
      const cloData = selectedAssessment.assessmentClos[cloId];
      if (cloData && cloData.marksAllocated) {
        return cloData.marksAllocated;
      }
    }
    
    return 0;
  }, [selectedAssessment]);

  // Validate marks before saving
  const validateMarks = useCallback(() => {
    if (!selectedAssessment) return false;
    
    const errors = {};
    let hasErrors = false;
    
    Object.entries(marksData).forEach(([studentId, studentMarks]) => {
      Object.entries(studentMarks).forEach(([cloId, marks]) => {
        const maxMarks = calculateCloMaxMarks(cloId);
        
        if (marks < 0) {
          errors[`${studentId}-${cloId}`] = 'Marks cannot be negative';
          hasErrors = true;
        }
        
        if (marks > maxMarks) {
          errors[`${studentId}-${cloId}`] = `Cannot exceed maximum marks (${maxMarks})`;
          hasErrors = true;
        }
      });
    });
    
    setValidationErrors(errors);
    return !hasErrors;
  }, [selectedAssessment, marksData, calculateCloMaxMarks]);

  // Save marks
  const handleSaveMarks = useCallback(async () => {
    if (!selectedAssessment) {
      alert('Please select an assessment first');
      return;
    }
    
    // Check if marks are finalized
    if (finalizationStatus?.assessment?.isMarksFinalized) {
      alert('❌ Cannot save marks: Marks are already finalized and locked.');
      return;
    }
    
    if (students.length === 0) {
      alert('No students found for this course');
      return;
    }
    
    if (!validateMarks()) {
      alert('Please fix validation errors before saving');
      return;
    }
    
    // Prepare marks entries
    const marksEntries = [];
    
    Object.entries(marksData).forEach(([studentId, studentMarks]) => {
      Object.entries(studentMarks).forEach(([cloId, marks]) => {
        if (marks !== undefined && marks !== null) {
          marksEntries.push({
            studentId,
            cloId,
            marksObtained: marks
          });
        }
      });
    });
    
    console.log("Preparing to save marks entries:", marksEntries);
    
    try {
      setSaving(true);
      
      console.log('Calling enterBulkMarks API...');
      const response = await assessmentApi.enterBulkMarks(selectedAssessment.id, { marksEntries });
      console.log("Save marks response:", response);
      
      const responseData = getResponseData(response);
      
      if (responseData?.success || response.status === 200) {
        const savedCount = responseData?.savedCount || marksEntries.length;
        showNotification(`✅ Marks saved successfully! ${savedCount} entries saved.`, 'success');
        
        // Refresh marks data
        await loadExistingMarks(selectedAssessment, students);
        
        // Notify parent component
        if (onEnterMarks) {
          onEnterMarks(selectedAssessment.id, marksEntries);
        }
      } else {
        showNotification(`❌ Failed to save marks: ${responseData?.message || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving marks:', error);
      showNotification(`❌ Failed to save marks: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [selectedAssessment, students, marksData, validateMarks, loadExistingMarks, onEnterMarks, finalizationStatus]);

  // Calculate statistics
  const calculateStatistics = useCallback(() => {
    if (!selectedAssessment || !marksData || Object.keys(marksData).length === 0) {
      return null;
    }
    
    const filteredStudents = students.filter(student =>
      student?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      student?.rollNumber?.toLowerCase().includes(filter.toLowerCase())
    );
    
    if (filteredStudents.length === 0) return null;
    
    const stats = {
      totalStudents: filteredStudents.length,
      marksEntered: 0,
      averageTotal: 0,
      cloAverages: {}
    };
    
    // Calculate CLO averages
    selectedAssessment.assessmentClos?.forEach(ac => {
      const cloId = ac.cloId;
      const total = filteredStudents.reduce((sum, student) => {
        return sum + (marksData[student.id]?.[cloId] || 0);
      }, 0);
      stats.cloAverages[cloId] = filteredStudents.length > 0 ? total / filteredStudents.length : 0;
    });
    
    // Calculate total averages
    const totalMarks = filteredStudents.reduce((sum, student) => {
      return sum + calculateStudentTotal(student.id);
    }, 0);
    stats.averageTotal = filteredStudents.length > 0 ? totalMarks / filteredStudents.length : 0;
    
    // Count marks entered (non-zero)
    stats.marksEntered = Object.values(marksData).reduce((count, studentMarks) => {
      return count + Object.values(studentMarks).filter(mark => mark > 0).length;
    }, 0);
    
    return stats;
  }, [selectedAssessment, students, marksData, filter, calculateStudentTotal]);

  // Filter students
  const filteredStudents = React.useMemo(() => {
    return students.filter(student =>
      student?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      student?.rollNumber?.toLowerCase().includes(filter.toLowerCase())
    );
  }, [students, filter]);

  // Calculate statistics for display
  const stats = React.useMemo(() => {
    return calculateStatistics() || assessmentStats;
  }, [calculateStatistics, assessmentStats]);

  // Initialize on component mount
  useEffect(() => {
    if (!initialized && course) {
      console.log('Component mounting with course:', course.id);
      initializeComponent();
    }
  }, [course, initialized, initializeComponent]);

  // Handle course changes
  useEffect(() => {
    if (course && course.id !== prevCourseRef.current?.id) {
      console.log('Course changed from', prevCourseRef.current?.id, 'to', course.id);
      setInitialized(false);
      setStudents([]);
      setMarksData({});
      setSelectedAssessment(null);
      setAssessmentStats(null);
      setValidationErrors({});
      setHasError(false);
      
      // Re-initialize with new course
      initializeComponent();
    }
    prevCourseRef.current = course;
  }, [course, initializeComponent]);

  // Handle assessment list changes
  useEffect(() => {
    if (!selectedAssessment && assessments?.length > 0) {
      // Auto-select first assessment if none selected
      const firstAssessment = assessments[0];
      console.log('Auto-selecting first assessment from list:', firstAssessment);
      handleAssessmentSelect(firstAssessment);
    }
  }, [assessments, selectedAssessment, handleAssessmentSelect]);

  // Debug logging
  useEffect(() => {
    console.log('Current MarksEntry state:', {
      initialized,
      loading,
      marksLoading,
      saving,
      studentsCount: students.length,
      marksDataKeys: Object.keys(marksData).length,
      selectedAssessment: selectedAssessment?.id,
      hasError,
      assessmentsCount: assessments?.length || 0,
      isFinalized: finalizationStatus?.assessment?.isMarksFinalized
    });
  }, [initialized, loading, marksLoading, saving, students.length, marksData, selectedAssessment, hasError, assessments, finalizationStatus]);

  // ========== NEW COMPONENTS FOR FINALIZATION UI ==========
  
  // Finalization Status Badge Component
  const FinalizationBadge = ({ status }) => {
    if (!status) return null;
    
    const isFinalized = status.assessment?.isMarksFinalized;
    const finalizedAt = status.assessment?.marksFinalizedAt;
    const finalizedBy = status.assessment?.marksFinalizedBy;
    
    if (isFinalized) {
      return (
        <div className="finalization-badge finalized">
          <Lock size={14} />
          <span>Finalized</span>
          <div className="finalization-details">
            <small>
              {finalizedAt ? new Date(finalizedAt).toLocaleDateString() : ''}
              {finalizedBy?.name ? ` by ${finalizedBy.name}` : ''}
            </small>
          </div>
        </div>
      );
    }
    
    return (
      <div className="finalization-badge not-finalized">
        <LockOpen size={14} />
        <span>Not Finalized</span>
        {status.canFinalize && (
          <small className="finalization-hint">Ready to finalize</small>
        )}
      </div>
    );
  };
  
  // Finalization Statistics Component
  const FinalizationStats = ({ status }) => {
    if (!status?.statistics) return null;
    
    const stats = status.statistics;
    
    return (
      <div className="finalization-stats">
        <div className="stat-item">
          <span className="stat-label">Students:</span>
          <span className="stat-value">{stats.totalStudents || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Missing:</span>
          <span className={`stat-value ${stats.missingMarks > 0 ? 'warning' : ''}`}>
            {stats.missingMarks || 0}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Completion:</span>
          <span className="stat-value">
            {stats.percentageEntered || '0'}%
          </span>
        </div>
      </div>
    );
  };

  // Finalization Modal Component
  const FinalizationModal = () => {
    if (!showFinalizationModal || !finalizationStatus) return null;
    
    const stats = finalizationStatus.statistics || {};
    const canFinalize = finalizationStatus.canFinalize;
    const missingMarks = stats.missingMarks || 0;
    const percentageEntered = parseFloat(stats.percentageEntered) || 0;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3><Lock size={20} /> Finalize Marks</h3>
            <button 
              className="modal-close" 
              onClick={() => setShowFinalizationModal(false)}
              disabled={isFinalizing}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="warning-box">
              <AlertTriangle size={24} />
              <div>
                <h4>⚠️ Important Notice</h4>
                <p><strong>Once marks are finalized, they cannot be modified or altered in any way.</strong></p>
                <p>Please ensure all marks are correctly entered before finalizing.</p>
              </div>
            </div>
            
            <div className="finalization-summary">
              <h4>Finalization Summary</h4>
              <FinalizationStats status={finalizationStatus} />
              
              {missingMarks > 0 && (
                <div className="warning-alert">
                  <AlertCircle size={16} />
                  <span><strong>{missingMarks} students are missing marks!</strong> All marks must be entered before finalizing.</span>
                </div>
              )}
              
              {percentageEntered === 100 && (
                <div className="success-alert">
                  <CheckCircle size={16} />
                  <span>✅ All marks have been entered! Ready for finalization.</span>
                </div>
              )}
              
              {percentageEntered < 100 && percentageEntered > 0 && (
                <div className="info-alert">
                  <Info size={16} />
                  <span>Only {percentageEntered}% of marks entered. Complete all entries for best results.</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowFinalizationModal(false)}
              disabled={isFinalizing}
            >
              Cancel
            </button>
            <button 
              className={`btn ${missingMarks > 0 ? 'btn-warning' : 'btn-primary'}`}
              onClick={handleFinalizeMarks}
              disabled={isFinalizing || !canFinalize}
              title={missingMarks > 0 ? "All marks must be entered before finalizing" : "Finalize marks (cannot be undone)"}
            >
              {isFinalizing ? (
                <>
                  <div className="spinner-small"></div>
                  Finalizing...
                </>
              ) : missingMarks > 0 ? (
                <>
                  <AlertTriangle size={16} />
                  Finalize Anyway ({missingMarks} missing)
                </>
              ) : (
                <>
                  <Lock size={16} />
                  Finalize Marks
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Check if marks are finalized (for disabling inputs)
  const isMarksFinalized = finalizationStatus?.assessment?.isMarksFinalized;

  // Add CSS for new components
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .finalization-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        font-weight: 500;
        margin-right: 10px;
      }
      
      .finalization-badge.finalized {
        background-color: #e8f5e9;
        color: #2e7d32;
        border: 1px solid #c8e6c9;
      }
      
      .finalization-badge.not-finalized {
        background-color: #fff3e0;
        color: #f57c00;
        border: 1px solid #ffe0b2;
      }
      
      .finalization-details {
        margin-left: 4px;
        font-size: 0.75rem;
        opacity: 0.8;
      }
      
      .finalization-hint {
        margin-left: 6px;
        font-style: italic;
      }
      
      .finalization-stats {
        display: flex;
        gap: 15px;
        margin: 15px 0;
        flex-wrap: wrap;
      }
      
      .finalization-stats .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 6px;
        min-width: 80px;
      }
      
      .finalization-stats .stat-label {
        font-size: 0.8rem;
        color: #666;
      }
      
      .finalization-stats .stat-value {
        font-weight: bold;
        font-size: 1.1rem;
      }
      
      .finalization-stats .stat-value.warning {
        color: #f44336;
      }
      
      .finalization-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }
      
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
      }
      
      .modal-content {
        background: white;
        border-radius: 8px;
        width: 500px;
        max-width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      }
      
      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
      }
      
      .modal-header h3 {
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .modal-body {
        padding: 20px;
      }
      
      .modal-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      
      .modal-close:hover {
        background: #f0f0f0;
      }
      
      .warning-box {
        display: flex;
        gap: 15px;
        padding: 15px;
        background: #fff3e0;
        border-left: 4px solid #ff9800;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      
      .warning-box svg {
        color: #f57c00;
        flex-shrink: 0;
      }
      
      .finalization-summary {
        padding: 15px;
        background: #f9f9f9;
        border-radius: 6px;
      }
      
      .warning-alert, .success-alert, .info-alert {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px;
        border-radius: 4px;
        margin-top: 10px;
      }
      
      .warning-alert {
        background: #ffebee;
        color: #c62828;
        border-left: 3px solid #f44336;
      }
      
      .success-alert {
        background: #e8f5e9;
        color: #2e7d32;
        border-left: 3px solid #4CAF50;
      }
      
      .info-alert {
        background: #e3f2fd;
        color: #1565c0;
        border-left: 3px solid #2196f3;
      }
      
      .marks-disabled-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.95);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 100;
        border-radius: 4px;
        backdrop-filter: blur(2px);
      }
      
      .marks-disabled-message {
        text-align: center;
        padding: 30px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        max-width: 400px;
      }
      
      .marks-disabled-message svg {
        color: #4CAF50;
        margin-bottom: 15px;
      }
      
      .assessment-status-bar {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 6px;
        border-left: 4px solid #007bff;
        flex-wrap: wrap;
      }
      
      .finalized-info {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #e8f5e9;
        border-radius: 4px;
        color: #2e7d32;
        font-size: 0.9rem;
      }
      
      .finalization-notification {
        animation: slideIn 0.3s ease;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .spinner-small {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s linear infinite;
        margin-right: 8px;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .btn-warning {
        background-color: #ff9800;
        border-color: #ff9800;
        color: white;
      }
      
      .btn-warning:hover {
        background-color: #f57c00;
        border-color: #f57c00;
      }
      
      .btn-warning:disabled {
        background-color: #ffcc80;
        border-color: #ffcc80;
        cursor: not-allowed;
      }
      
      .marks-input:disabled {
        background-color: #f5f5f5 !important;
        color: #666 !important;
        cursor: not-allowed !important;
        border-color: #ddd !important;
      }
      
      .save-btn:disabled {
        background-color: #6c757d !important;
        border-color: #6c757d !important;
        cursor: not-allowed !important;
      }
      
      .finalization-locked {
        opacity: 0.7;
        pointer-events: none;
      }
      
      .finalization-locked .marks-input {
        background-color: #f9f9f9;
        border-color: #eee;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  if (!course) {
    return (
      <div className="no-course">
        <FileText size={48} />
        <h4>No Course Selected</h4>
        <p>Please select a course from the sidebar</p>
      </div>
    );
  }

  return (
    <div className="marks-entry-tab">
      <div className="marks-header">
        <div className="assessment-selector">
          <label>Select Assessment</label>
          <select
            className="form-control"
            value={selectedAssessment?.id || ''}
            onChange={(e) => {
              const assessment = assessments.find(a => a.id === e.target.value);
              handleAssessmentSelect(assessment);
            }}
            disabled={loading || saving || marksLoading || isFinalizing}
          >
            <option value="">Select Assessment</option>
            {Array.isArray(assessments) && assessments.map(assessment => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.title || 'Untitled'} ({assessment.maxMarks || 0} marks)
              </option>
            ))}
          </select>
        </div>
        
        <div className="header-actions">
          {selectedAssessment && (
            <div className="student-filter">
              <label>Filter Students</label>
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Search by name or roll number"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  disabled={loading || saving || marksLoading || isFinalizing}
                />
              </div>
            </div>
          )}
          
          <button 
            className="btn btn-secondary refresh-btn"
            onClick={() => initializeComponent()}
            disabled={loading || saving || marksLoading || isFinalizing}
            title="Refresh data"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>
      
      {selectedAssessment ? (
        <div className="marks-container">
          {/* Assessment Status Bar */}
          <div className="assessment-status-bar">
            <FinalizationBadge status={finalizationStatus} />
            <FinalizationStats status={finalizationStatus} />
            
            {finalizationStatus?.canFinalize && !isMarksFinalized && (
              <div className="finalization-actions">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowFinalizationModal(true)}
                  disabled={isFinalizing}
                >
                  <Lock size={14} />
                  Finalize Marks
                </button>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => checkFinalizationStatus(selectedAssessment.id)}
                  title="Refresh status"
                  disabled={isFinalizing}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}
            
            {isMarksFinalized && (
              <div className="finalized-info">
                <Lock size={14} />
                <span><strong>Marks are finalized and cannot be modified.</strong></span>
                {finalizationStatus?.assessment?.marksFinalizedBy && (
                  <small>
                    Finalized by {finalizationStatus.assessment.marksFinalizedBy.name} on{' '}
                    {finalizationStatus.assessment.marksFinalizedAt ? 
                      new Date(finalizationStatus.assessment.marksFinalizedAt).toLocaleDateString() : ''}
                  </small>
                )}
              </div>
            )}
          </div>
          
          <div className="assessment-info">
            <div className="assessment-header">
              <h4>{selectedAssessment.title || 'Untitled Assessment'}</h4>
              <div className="assessment-status">
                {marksLoading && <span className="loading-indicator">Loading marks...</span>}
                {!marksLoading && stats && (
                  <span className="stats-info">
                    <CheckCircle size={14} /> {stats.marksEntered || 0} marks entered
                  </span>
                )}
              </div>
            </div>
            
            <div className="assessment-details">
              <span className="detail-item">Type: {selectedAssessment.type || 'N/A'}</span>
              <span className="detail-item">Max Marks: {selectedAssessment.maxMarks || 0}</span>
              <span className="detail-item">
                CLOs: {selectedAssessment.assessmentClos?.map(ac => ac.clo?.code).join(', ') || 'No CLOs'}
              </span>
              {stats && (
                <span className="detail-item">
                  Students: {stats.totalStudents || 0}
                </span>
              )}
            </div>
          </div>
          
          {/* Loading state */}
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading data...</p>
              <small>Fetching students and marks information</small>
            </div>
          ) : hasError ? (
            <div className="error-state">
              <AlertCircle size={48} />
              <h4>Error Loading Data</h4>
              <p>Failed to load student data. Please try again.</p>
              <button 
                className="btn btn-primary" 
                onClick={initializeComponent}
                disabled={loading}
              >
                Retry Loading
              </button>
            </div>
          ) : students.length === 0 ? (
            <div className="no-students">
              <FileText size={48} />
              <h4>No Students Found</h4>
              <p>No students are enrolled in this course for the selected semester.</p>
              <button 
                className="btn btn-secondary" 
                onClick={loadStudents}
                disabled={loading}
              >
                Check Again
              </button>
            </div>
          ) : (
            <>
              {/* Marks loading overlay */}
              
              
              {/* Marks Table */}
              {!marksLoading && (
                <>
                  <div className={`marks-table-container ${isMarksFinalized ? 'finalization-locked' : ''}`}>
                    <div className="marks-table">
                      <table>
                        <thead>
                          <tr>
                            <th>Roll No</th>
                            <th>Student Name</th>
                            {selectedAssessment.assessmentClos?.map(ac => (
                              <th key={ac.cloId}>
                                <div className="clo-header">
                                  <div className="clo-code">{ac.clo?.code || 'CLO'}</div>
                                  <small className="clo-marks">({ac.marksAllocated || 0} marks)</small>
                                  {stats?.cloAverages?.[ac.cloId] && (
                                    <div className="clo-average-header">
                                      Avg: {stats.cloAverages[ac.cloId].toFixed(1)}
                                    </div>
                                  )}
                                </div>
                              </th>
                            ))}
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.length === 0 ? (
                            <tr>
                              <td colSpan={(selectedAssessment.assessmentClos?.length || 0) + 3} className="no-results">
                                No students match your search
                              </td>
                            </tr>
                          ) : (
                            filteredStudents.map(student => (
                              <tr key={student.id}>
                                <td className="roll-number">{student.rollNumber || 'N/A'}</td>
                                <td className="student-name">{student.name || 'Unknown'}</td>
                                {selectedAssessment.assessmentClos?.map(ac => {
                                  const maxMarks = ac.marksAllocated || 0;
                                  const currentMarks = marksData[student.id]?.[ac.cloId] || 0;
                                  const errorKey = `${student.id}-${ac.cloId}`;
                                  const isInvalid = validationErrors[errorKey];
                                  const errorMessage = validationErrors[errorKey];
                                  
                                  return (
                                    <td key={ac.cloId} className={isInvalid ? 'has-error' : ''}>
                                      <input
                                        type="number"
                                        className={`marks-input ${isInvalid ? 'invalid' : ''}`}
                                        value={currentMarks}
                                        onChange={(e) => handleMarksChange(student.id, ac.cloId, e.target.value)}
                                        min="0"
                                        max={maxMarks}
                                        step="0.5"
                                        disabled={saving || isMarksFinalized}
                                        title={isMarksFinalized ? "Marks are finalized and cannot be modified" : ""}
                                      />
                                      {isInvalid && (
                                        <div className="input-error">
                                          <AlertCircle size={12} /> {errorMessage}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="student-total">
                                  <div className="total-value">
                                    {calculateStudentTotal(student.id).toFixed(1)}
                                  </div>
                                  <div className="student-percentage">
                                    {((calculateStudentTotal(student.id) / selectedAssessment.maxMarks) * 100).toFixed(1)}%
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="marks-actions">
                    <div className="summary-info">
                      <span>
                        Showing {filteredStudents.length} of {students.length} students
                      </span>
                      {filter && (
                        <span className="filter-active">
                          Filter active: "{filter}"
                        </span>
                      )}
                      {Object.keys(validationErrors).length > 0 && (
                        <span className="validation-error">
                          <AlertCircle size={14} /> {Object.keys(validationErrors).length} validation errors
                        </span>
                      )}
                    </div>
                    <button 
                      className="btn btn-success save-btn" 
                      onClick={handleSaveMarks}
                      disabled={saving || students.length === 0 || marksLoading || isMarksFinalized}
                      title={isMarksFinalized ? "Marks are finalized and cannot be saved" : ""}
                    >
                      {saving ? (
                        <>
                          <div className="spinner-small"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save All Marks
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="no-assessment">
          <FileText size={48} />
          <h4>Select an Assessment</h4>
          <p>Choose an assessment from the dropdown to enter marks</p>
          {assessments?.length === 0 && (
            <div className="alert alert-info">
              No assessments created yet. Create an assessment first.
            </div>
          )}
          {loading && (
            <div className="loading-small">
              <div className="spinner"></div>
              <span>Loading assessments...</span>
            </div>
          )}
        </div>
      )}
      
      {/* Finalization Modal */}
      <FinalizationModal />
    </div>
  );
};

export default MarksEntry;