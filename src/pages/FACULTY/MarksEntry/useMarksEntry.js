
// src/components/faculty/MarksEntry/useMarksEntry.js
import { useState, useCallback, useEffect, useRef } from 'react';
import assessmentApi from '../../../apis/assessments/assessment';

const getResponseData = (response) => {
  if (response?.data?.data) return response.data.data;
  if (response?.data) return response.data;
  return response;
};

export const showNotification = (message, type = 'success') => {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${type === 'success' ? '#22c55e' : '#ef4444'};
    color: white; padding: 14px 20px; border-radius: 8px;
    z-index: 9999; box-shadow: 0 4px 16px rgba(0,0,0,0.18);
    font-size: 13px; font-weight: 500; max-width: 380px;
    display: flex; align-items: center; gap: 8px;
    animation: me-slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.parentNode && notification.remove(), 5000);
};

export const useMarksEntry = ({ course, assessments, initialSelected, onSelectAssessment, onEnterMarks }) => {
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
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizationStatus, setFinalizationStatus] = useState(null);
  const [showFinalizationModal, setShowFinalizationModal] = useState(false);

  const prevCourseRef = useRef(null);

  // ── Finalization status ─────────────────────────────────────────────────
  const checkFinalizationStatus = useCallback(async (assessmentId) => {
    if (!assessmentId) return;
    try {
      const response = await assessmentApi.getAssessmentFinalizationStatus(assessmentId);
      const statusData = getResponseData(response);
      setFinalizationStatus(statusData?.data || statusData);
      return statusData;
    } catch {
      setFinalizationStatus(null);
      return null;
    }
  }, []);

  const handleFinalizeMarks = useCallback(async () => {
    if (!selectedAssessment) { alert('Please select an assessment first'); return; }
    try {
      setIsFinalizing(true);
      await assessmentApi.finalizeAssessmentMarks(selectedAssessment.id);
      await checkFinalizationStatus(selectedAssessment.id);
      showNotification('✅ Marks finalized successfully! Marks are now locked.', 'success');
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      showNotification(`❌ Error: ${msg}`, 'error');
    } finally {
      setIsFinalizing(false);
      setShowFinalizationModal(false);
    }
  }, [selectedAssessment, checkFinalizationStatus]);

  // ── Load marks ──────────────────────────────────────────────────────────
  const loadExistingMarks = useCallback(async (selectedAssess, studentList) => {
    if (!selectedAssess) return;
    try {
      setMarksLoading(true);
      const response = await assessmentApi.getAssessmentMarks(selectedAssess.id);
      const responseData = getResponseData(response);
      if (!responseData) throw new Error('No data received');

      setAssessmentStats(responseData?.statistics || {});
      const closFromResponse = responseData?.clos || [];
      const studentsData = responseData?.students || [];
      const newMarksData = {};

      if (studentsData.length > 0) {
        studentsData.forEach(studentMark => {
          const sid = studentMark.studentId;
          if (!sid) return;
          if (!newMarksData[sid]) newMarksData[sid] = {};
          if (studentMark.marksByClo) {
            Object.entries(studentMark.marksByClo).forEach(([cloId, cloData]) => {
              if (cloData?.marksObtained !== undefined)
                newMarksData[sid][cloId] = parseFloat(cloData.marksObtained) || 0;
            });
          }
          if (studentMark.marksEntries) {
            studentMark.marksEntries.forEach(entry => {
              if (entry.cloId && entry.marksObtained !== undefined)
                newMarksData[sid][entry.cloId] = parseFloat(entry.marksObtained) || 0;
            });
          }
        });
      }

      studentList.forEach(student => {
        if (!newMarksData[student.id]) newMarksData[student.id] = {};
        const closToUse = closFromResponse.length > 0 ? closFromResponse : selectedAssess.assessmentClos;
        closToUse?.forEach(clo => {
          const cloId = clo.id || clo.cloId;
          if (cloId && newMarksData[student.id][cloId] === undefined)
            newMarksData[student.id][cloId] = 0;
        });
      });

      setMarksData(newMarksData);
    } catch {
      const newMarksData = {};
      studentList.forEach(student => {
        newMarksData[student.id] = {};
        selectedAssess.assessmentClos?.forEach(ac => {
          newMarksData[student.id][ac.cloId] = 0;
        });
      });
      setMarksData(newMarksData);
    } finally {
      setMarksLoading(false);
    }
  }, []);

  // ── Initialize ──────────────────────────────────────────────────────────
  const initializeComponent = useCallback(async () => {
    if (!course) { setInitialized(true); return; }
    try {
      setLoading(true);
      setHasError(false);

      const studentsResponse = await assessmentApi.getCourseStudents(course.id, {
        semester: course.semester, year: course.year
      });
      const studentsData = getResponseData(studentsResponse)?.students || [];
      setStudents(studentsData);

      let selectedAssess = selectedAssessment;
      if (!selectedAssess && assessments?.length > 0) {
        selectedAssess = assessments[0];
        setSelectedAssessment(selectedAssess);
        if (onSelectAssessment) onSelectAssessment(selectedAssess);
      }

      if (selectedAssess && studentsData.length > 0) {
        await loadExistingMarks(selectedAssess, studentsData);
        await checkFinalizationStatus(selectedAssess.id);
      } else if (selectedAssess) {
        const initialMarks = {};
        studentsData.forEach(student => {
          initialMarks[student.id] = {};
          selectedAssess.assessmentClos?.forEach(ac => { initialMarks[student.id][ac.cloId] = 0; });
        });
        setMarksData(initialMarks);
        await checkFinalizationStatus(selectedAssess.id);
      }
      setInitialized(true);
    } catch (error) {
      setHasError(true);
      alert(`Failed to initialize: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  }, [course, assessments, selectedAssessment, onSelectAssessment, loadExistingMarks, checkFinalizationStatus]);

  const loadStudents = useCallback(async () => {
    if (!course) return;
    try {
      setLoading(true); setHasError(false);
      const response = await assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year });
      const studentsData = getResponseData(response)?.students || [];
      setStudents(studentsData);
      if (selectedAssessment && studentsData.length > 0)
        await loadExistingMarks(selectedAssessment, studentsData);
      return studentsData;
    } catch (error) {
      setHasError(true); throw error;
    } finally { setLoading(false); }
  }, [course, selectedAssessment, loadExistingMarks]);

  // ── Assessment select ───────────────────────────────────────────────────
  const handleAssessmentSelect = useCallback(async (assessment) => {
    setSelectedAssessment(assessment);
    if (onSelectAssessment) onSelectAssessment(assessment);
    setMarksData({}); setAssessmentStats(null); setValidationErrors({}); setFinalizationStatus(null);
    if (assessment && students.length > 0) {
      await Promise.all([loadExistingMarks(assessment, students), checkFinalizationStatus(assessment.id)]);
    } else if (assessment) {
      const initialMarks = {};
      students.forEach(s => { initialMarks[s.id] = {}; assessment.assessmentClos?.forEach(ac => { initialMarks[s.id][ac.cloId] = 0; }); });
      setMarksData(initialMarks);
      await checkFinalizationStatus(assessment.id);
    }
  }, [students, onSelectAssessment, loadExistingMarks, checkFinalizationStatus]);

  // ── Marks editing ───────────────────────────────────────────────────────
  const handleMarksChange = useCallback((studentId, cloId, value) => {
    if (finalizationStatus?.assessment?.isMarksFinalized) { alert('Marks are finalized and cannot be modified.'); return; }
    const numValue = parseFloat(value) || 0;
    setMarksData(prev => {
      const next = { ...prev };
      if (!next[studentId]) next[studentId] = {};
      next[studentId][cloId] = numValue;
      return next;
    });
    setValidationErrors(prev => { const n = { ...prev }; delete n[`${studentId}-${cloId}`]; return n; });
  }, [finalizationStatus]);

  // ── Calculations ────────────────────────────────────────────────────────
  const calculateStudentTotal = useCallback((studentId) => {
    if (!selectedAssessment || !marksData[studentId]) return 0;
    return (selectedAssessment.assessmentClos || []).reduce((t, ac) => t + (marksData[studentId][ac.cloId] || 0), 0);
  }, [selectedAssessment, marksData]);

  const calculateCloMaxMarks = useCallback((cloId) => {
    if (!selectedAssessment) return 0;
    const alloc = selectedAssessment.assessmentClos?.find(ac => ac.cloId === cloId);
    return alloc?.marksAllocated || 0;
  }, [selectedAssessment]);

  const validateMarks = useCallback(() => {
    const errors = {};
    Object.entries(marksData).forEach(([studentId, studentMarks]) => {
      Object.entries(studentMarks).forEach(([cloId, marks]) => {
        const max = calculateCloMaxMarks(cloId);
        if (marks < 0) errors[`${studentId}-${cloId}`] = 'Cannot be negative';
        if (marks > max) errors[`${studentId}-${cloId}`] = `Cannot exceed ${max}`;
      });
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [marksData, calculateCloMaxMarks]);

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSaveMarks = useCallback(async () => {
    if (!selectedAssessment) { alert('Please select an assessment first'); return; }
    if (finalizationStatus?.assessment?.isMarksFinalized) { alert('Cannot save: Marks are already finalized and locked.'); return; }
    if (students.length === 0) { alert('No students found'); return; }
    if (!validateMarks()) { alert('Please fix validation errors before saving'); return; }

    const marksEntries = [];
    Object.entries(marksData).forEach(([studentId, studentMarks]) => {
      Object.entries(studentMarks).forEach(([cloId, marks]) => {
        if (marks !== undefined && marks !== null)
          marksEntries.push({ studentId, cloId, marksObtained: marks });
      });
    });

    try {
      setSaving(true);
      const response = await assessmentApi.enterBulkMarks(selectedAssessment.id, { marksEntries });
      const responseData = getResponseData(response);
      if (responseData?.success || response.status === 200) {
        showNotification(`✅ ${responseData?.savedCount || marksEntries.length} marks saved successfully!`, 'success');
        await loadExistingMarks(selectedAssessment, students);
        if (onEnterMarks) onEnterMarks(selectedAssessment.id, marksEntries);
      } else {
        showNotification(`❌ ${responseData?.message || 'Failed to save marks'}`, 'error');
      }
    } catch (error) {
      showNotification(`❌ ${error.response?.data?.message || error.message}`, 'error');
    } finally { setSaving(false); }
  }, [selectedAssessment, students, marksData, validateMarks, loadExistingMarks, onEnterMarks, finalizationStatus]);

  // ── Stats ───────────────────────────────────────────────────────────────
  const calculateStatistics = useCallback(() => {
    if (!selectedAssessment || !marksData || !Object.keys(marksData).length) return null;
    const fs = students.filter(s =>
      s?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      s?.rollNumber?.toLowerCase().includes(filter.toLowerCase())
    );
    if (!fs.length) return null;
    const cloAverages = {};
    selectedAssessment.assessmentClos?.forEach(ac => {
      const total = fs.reduce((s, st) => s + (marksData[st.id]?.[ac.cloId] || 0), 0);
      cloAverages[ac.cloId] = fs.length > 0 ? total / fs.length : 0;
    });
    const totalMarks = fs.reduce((s, st) => s + calculateStudentTotal(st.id), 0);
    return {
      totalStudents: fs.length,
      marksEntered: Object.values(marksData).reduce((c, sm) => c + Object.values(sm).filter(m => m > 0).length, 0),
      averageTotal: fs.length > 0 ? totalMarks / fs.length : 0,
      cloAverages
    };
  }, [selectedAssessment, students, marksData, filter, calculateStudentTotal]);

  // ── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialized && course) initializeComponent();
  }, [course, initialized, initializeComponent]);

  useEffect(() => {
    if (course && course.id !== prevCourseRef.current?.id) {
      setInitialized(false); setStudents([]); setMarksData([]);
      setSelectedAssessment(null); setAssessmentStats(null);
      setValidationErrors({}); setHasError(false);
      initializeComponent();
    }
    prevCourseRef.current = course;
  }, [course, initializeComponent]);

  useEffect(() => {
    if (!selectedAssessment && assessments?.length > 0)
      handleAssessmentSelect(assessments[0]);
  }, [assessments, selectedAssessment, handleAssessmentSelect]);

  const filteredStudents = students.filter(s =>
    s?.name?.toLowerCase().includes(filter.toLowerCase()) ||
    s?.rollNumber?.toLowerCase().includes(filter.toLowerCase())
  );

  const stats = calculateStatistics() || assessmentStats;
  const isMarksFinalized = finalizationStatus?.assessment?.isMarksFinalized;

  return {
    // state
    selectedAssessment, students, marksData, filter, setFilter,
    loading, saving, marksLoading, validationErrors,
    hasError, initialized, isFinalizing, finalizationStatus,
    showFinalizationModal, setShowFinalizationModal,
    stats, filteredStudents, isMarksFinalized,
    // actions
    initializeComponent, loadStudents, handleAssessmentSelect,
    handleMarksChange, handleSaveMarks, handleFinalizeMarks,
    checkFinalizationStatus, calculateStudentTotal, calculateCloMaxMarks,
  };
};