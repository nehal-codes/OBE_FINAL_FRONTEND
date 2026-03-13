// src/components/faculty/StudentPerformanceAnalysis.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Users, Award, AlertTriangle, CheckCircle,
  Target, ChevronDown, ChevronRight, FileText, Layers,
  BookOpen, Clock, Star
} from 'lucide-react';
import assessmentApi from "../../apis/assessments/assessment";
import facultyApi from "../../apis/faculty";
import PerformanceHeader from './Performance/PerformanceHeader';
import AssessmentDetails from './Performance/AssessmentDetails';
import CLOAnalysisSection from './Performance/CLOAnalysisSection';
import QuickGlanceDashboard from './Performance/QuickGlanceDashboard';
import StudentPerformanceTable from './Performance/StudentPerformanceTable';
import AttainmentSummary from './Performance/AttainmentSummary';

// ─── Utilities ───────────────────────────────────────────────────────────────
const getResponseData = (response) => {
  if (response?.data?.data) return response.data.data;
  if (response?.data) return response.data;
  return response;
};

export const calculateAttainmentLevel = (percentage, threshold) => {
  if (percentage < threshold) return 0;
  if (percentage < threshold + 10) return 1;
  if (percentage < threshold + 20) return 2;
  return 3;
};

// ─── CLO Analysis Helpers ────────────────────────────────────────────────────
const analyzeCLOPerformance = (marksData, studentsData, closData, courseInfo) => {
  if (!marksData || !studentsData) return null;

  const marksStudents = marksData.students || [];
  const assessmentClos = marksData.clos || [];

  const studentMap = {};
  studentsData.forEach(s => { studentMap[s.id] = s; });

  const cloMap = {};
  closData.forEach(c => {
    cloMap[c.id] = {
      threshold: c.attainmentThreshold || 50,
      code: c.code, statement: c.statement, bloomLevel: c.bloomLevel
    };
  });

  const cloAnalysis = {};
  const studentCLOPerformance = {};

  marksStudents.forEach(ms => {
    const sid = ms.studentId;
    if (!studentCLOPerformance[sid]) {
      studentCLOPerformance[sid] = {
        studentId: sid,
        rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A',
        name: ms.name || studentMap[sid]?.name || 'Unknown',
        cloPerformance: {}, totalObtained: 0, totalMax: 0
      };
    }
  });

  assessmentClos.forEach(clo => {
    const cloId = clo.id;
    const maxMarks = clo.marksAllocated || 0;
    const threshold = cloMap[cloId]?.threshold || 50;
    const cloCode = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0, 4)}`;
    const cloStudentScores = [];

    marksStudents.forEach(ms => {
      const sid = ms.studentId;
      const mData = (ms.marksByClo || {})[cloId];
      const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0;
      const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;
      const attained = percentage >= threshold;
      const attainmentLevel = calculateAttainmentLevel(percentage, threshold);

      if (studentCLOPerformance[sid]) {
        studentCLOPerformance[sid].cloPerformance[cloId] = {
          obtained, maxMarks, percentage, threshold, attained, attainmentLevel,
          code: cloCode, statement: cloMap[cloId]?.statement || clo.statement || ''
        };
        studentCLOPerformance[sid].totalObtained += obtained;
        studentCLOPerformance[sid].totalMax += maxMarks;
      }

      cloStudentScores.push({
        studentId: sid,
        rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A',
        name: ms.name || studentMap[sid]?.name || 'Unknown',
        obtained, maxMarks, percentage, attained, attainmentLevel
      });
    });

    const attainedStudents = cloStudentScores.filter(s => s.attained).length;
    const totalStudents = cloStudentScores.length;
    const classAttainment = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
    const directAttainmentLevel = classAttainment >= 60 ? 3 : classAttainment >= 50 ? 2 : classAttainment >= 40 ? 1 : 0;

    cloAnalysis[cloId] = {
      id: cloId, code: cloCode,
      statement: cloMap[cloId]?.statement || clo.statement || '',
      bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '',
      maxMarks, threshold, studentScores: cloStudentScores,
      statistics: {
        totalStudents, attainedStudents, classAttainment,
        averageScore: totalStudents > 0 ? cloStudentScores.reduce((s, x) => s + x.percentage, 0) / totalStudents : 0,
        maxScore: totalStudents > 0 ? Math.max(...cloStudentScores.map(s => s.percentage)) : 0,
        minScore: totalStudents > 0 ? Math.min(...cloStudentScores.map(s => s.percentage)) : 0,
        attainmentDistribution: {
          level0: cloStudentScores.filter(s => s.attainmentLevel === 0).length,
          level1: cloStudentScores.filter(s => s.attainmentLevel === 1).length,
          level2: cloStudentScores.filter(s => s.attainmentLevel === 2).length,
          level3: cloStudentScores.filter(s => s.attainmentLevel === 3).length,
        }
      },
      directAttainment: {
        percentage: classAttainment, level: directAttainmentLevel,
        label: directAttainmentLevel === 3 ? 'High' : directAttainmentLevel === 2 ? 'Medium' : directAttainmentLevel === 1 ? 'Low' : 'Not Attained'
      }
    };
  });

  const students = Object.values(studentCLOPerformance).map(s => ({
    ...s, totalPercentage: s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0
  }));

  return {
    assessment: {
      id: marksData.assessment?.id || marksData.id,
      title: marksData.assessment?.title || marksData.title || 'Assessment',
      type: marksData.assessment?.type || marksData.type,
      maxMarks: marksData.assessment?.maxMarks || marksData.maxMarks,
      duration: marksData.assessment?.duration || marksData.duration,
      conductedOn: marksData.assessment?.conductedOn || marksData.conductedOn
    },
    course: {
      id: courseInfo.id, code: courseInfo.code, name: courseInfo.name,
      credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year
    },
    clos: assessmentClos.map(c => ({
      id: c.id,
      code: cloMap[c.id]?.code || c.code || `CLO-${c.id.slice(0, 4)}`,
      statement: cloMap[c.id]?.statement || c.statement || '',
      bloomLevel: cloMap[c.id]?.bloomLevel || c.bloomLevel || '',
      maxMarks: c.marksAllocated || 0,
      threshold: cloMap[c.id]?.threshold || 50
    })),
    cloAnalysis, students, generatedAt: new Date().toISOString()
  };
};

const combineCLOPerformance = (assessmentsData, studentsData, closData, courseInfo, finalizedAssessments) => {
  if (!assessmentsData || assessmentsData.length === 0) return null;

  const studentMap = {};
  studentsData.forEach(s => { studentMap[s.id] = s; });

  const cloMap = {};
  closData.forEach(c => {
    cloMap[c.id] = { threshold: c.attainmentThreshold || 50, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel };
  });

  // FIX #1: Build allAssessments from finalizedAssessments (source of truth for IDs)
  // then match to marks data by title/index as fallback
  const allAssessments = finalizedAssessments.map((fa, idx) => {
    const matchingMarks = assessmentsData[idx]; // same order as Promise.all
    return {
      id: fa.id, // ← use the finalized assessment's real ID, not marks data
      title: fa.title || matchingMarks?.assessment?.title || matchingMarks?.title || 'Assessment',
      type: fa.type || matchingMarks?.assessment?.type || matchingMarks?.type,
      maxMarks: fa.maxMarks || matchingMarks?.assessment?.maxMarks || matchingMarks?.maxMarks,
    };
  });

  const combinedCloAnalysis = {};
  const studentCombinedPerformance = {};
  const assessmentWiseStats = [];

  assessmentsData.forEach((assessmentData, idx) => {
    const marksStudents = assessmentData.students || [];
    const assessmentClos = assessmentData.clos || [];
    // FIX #1: use the real assessment ID from finalizedAssessments
    const realAssessmentId = finalizedAssessments[idx]?.id || assessmentData.assessment?.id || assessmentData.id;
    const assessmentTitle = finalizedAssessments[idx]?.title || assessmentData.assessment?.title || assessmentData.title;

    const studentScores = marksStudents.map(s => {
      let tot = 0, mx = 0;
      Object.values(s.marksByClo || {}).forEach(m => { tot += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; });
      return mx > 0 ? (tot / mx) * 100 : 0;
    });

    assessmentWiseStats.push({
      assessment: {
        id: realAssessmentId,
        title: assessmentTitle,
        type: finalizedAssessments[idx]?.type || assessmentData.assessment?.type || assessmentData.type,
        maxMarks: finalizedAssessments[idx]?.maxMarks || assessmentData.assessment?.maxMarks || assessmentData.maxMarks
      },
      classAverage: studentScores.length > 0 ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length : 0,
      totalStudents: marksStudents.length,
      clos: assessmentClos.map(c => ({ id: c.id, code: cloMap[c.id]?.code || c.code, maxMarks: c.marksAllocated }))
    });

    assessmentClos.forEach(clo => {
      const cloId = clo.id;
      const maxMarks = clo.marksAllocated || 0;
      const threshold = cloMap[cloId]?.threshold || 50;
      const cloCode = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0, 4)}`;

      if (!combinedCloAnalysis[cloId]) {
        combinedCloAnalysis[cloId] = {
          id: cloId, code: cloCode,
          statement: cloMap[cloId]?.statement || clo.statement || '',
          bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '',
          threshold, assessments: [], studentScores: {}, totalOccurrences: 0
        };
      }

      combinedCloAnalysis[cloId].assessments.push({ id: realAssessmentId, title: assessmentTitle, maxMarks });

      marksStudents.forEach(ms => {
        const sid = ms.studentId;
        const mData = (ms.marksByClo || {})[cloId];
        const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0;
        const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;
        const attained = percentage >= threshold;
        const attainmentLevel = calculateAttainmentLevel(percentage, threshold);

        if (!combinedCloAnalysis[cloId].studentScores[sid]) {
          combinedCloAnalysis[cloId].studentScores[sid] = {
            studentId: sid,
            rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A',
            name: ms.name || studentMap[sid]?.name || 'Unknown',
            scores: [], percentages: [], attainedCount: 0, totalObtained: 0, totalMax: 0
          };
        }

        const scd = combinedCloAnalysis[cloId].studentScores[sid];
        scd.scores.push({ assessmentId: realAssessmentId, assessmentTitle, obtained, maxMarks, percentage, attained, attainmentLevel });
        scd.percentages.push(percentage);
        scd.totalObtained += obtained;
        scd.totalMax += maxMarks;
        if (attained) scd.attainedCount += 1;
      });

      combinedCloAnalysis[cloId].totalOccurrences += 1;
    });

    marksStudents.forEach(ms => {
      const sid = ms.studentId;
      if (!studentCombinedPerformance[sid]) {
        studentCombinedPerformance[sid] = {
          studentId: sid,
          rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A',
          name: ms.name || studentMap[sid]?.name || 'Unknown',
          cloPerformance: {}, totalObtained: 0, totalMax: 0, assessmentsAttempted: 0, assessmentScores: []
        };
      }
      let tot = 0, mx = 0;
      Object.values(ms.marksByClo || {}).forEach(m => { tot += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; });
      studentCombinedPerformance[sid].assessmentScores.push({
        assessmentId: realAssessmentId, assessmentTitle,
        totalPercentage: mx > 0 ? (tot / mx) * 100 : 0, obtained: tot, maxMarks: mx
      });
      studentCombinedPerformance[sid].assessmentsAttempted += 1;
    });
  });

  Object.keys(combinedCloAnalysis).forEach(cloId => {
    const clo = combinedCloAnalysis[cloId];
    const arr = Object.values(clo.studentScores);
    const totalStudents = arr.length;

    arr.forEach(s => {
      s.averagePercentage = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0;
      s.overallAttained = s.attainedCount >= Math.ceil(clo.totalOccurrences * 0.7);
      s.overallAttainmentLevel = calculateAttainmentLevel(s.averagePercentage, clo.threshold);
    });

    const attainedStudents = arr.filter(s => s.overallAttained).length;
    const classAttainment = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
    const directAttainmentLevel = classAttainment >= 60 ? 3 : classAttainment >= 50 ? 2 : classAttainment >= 40 ? 1 : 0;

    clo.statistics = {
      totalStudents, attainedStudents, classAttainment,
      averageScore: totalStudents > 0 ? arr.reduce((s, x) => s + x.averagePercentage, 0) / totalStudents : 0,
      attainmentDistribution: {
        level0: arr.filter(s => s.overallAttainmentLevel === 0).length,
        level1: arr.filter(s => s.overallAttainmentLevel === 1).length,
        level2: arr.filter(s => s.overallAttainmentLevel === 2).length,
        level3: arr.filter(s => s.overallAttainmentLevel === 3).length,
      }
    };

    clo.directAttainment = {
      percentage: classAttainment, level: directAttainmentLevel,
      label: directAttainmentLevel === 3 ? 'High' : directAttainmentLevel === 2 ? 'Medium' : directAttainmentLevel === 1 ? 'Low' : 'Not Attained'
    };

    arr.forEach(s => {
      if (studentCombinedPerformance[s.studentId]) {
        studentCombinedPerformance[s.studentId].cloPerformance[cloId] = {
          code: clo.code, averagePercentage: s.averagePercentage, overallAttained: s.overallAttained,
          attainmentLevel: s.overallAttainmentLevel, assessmentsCount: clo.totalOccurrences,
          attainedCount: s.attainedCount, percentages: s.percentages, scores: s.scores
        };
        studentCombinedPerformance[s.studentId].totalObtained += s.totalObtained;
        studentCombinedPerformance[s.studentId].totalMax += s.totalMax;
      }
    });
  });

  const students = Object.values(studentCombinedPerformance).map(s => {
    const totalPercentage = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0;
    const closAttained = Object.values(s.cloPerformance).filter(c => c.overallAttained).length;
    const totalClos = Object.keys(s.cloPerformance).length;
    return { ...s, totalPercentage, closAttained, totalClos, overallAttained: closAttained >= Math.ceil(totalClos * 0.7) };
  });

  return {
    assessments: allAssessments, assessmentWiseStats,
    course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year },
    clos: Object.values(combinedCloAnalysis).map(c => ({ id: c.id, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel, threshold: c.threshold })),
    cloAnalysis: combinedCloAnalysis, students, generatedAt: new Date().toISOString()
  };
};

// ─── Export Helpers ──────────────────────────────────────────────────────────
const buildCSV = (performanceData, isAllMode) => {
  const cloList = Object.values(performanceData.cloAnalysis);

  let csv = 'CLO Attainment Summary\n';
  csv += "CLO Code,Bloom's Level,Threshold,Total Students,Students Attained,Class Attainment %,Direct Attainment Level\n";
  cloList.forEach(clo => {
    csv += `${clo.code},${clo.bloomLevel || 'N/A'},${clo.threshold}%,${clo.statistics.totalStudents},${clo.statistics.attainedStudents},${clo.statistics.classAttainment.toFixed(1)}%,Level ${clo.directAttainment.level} (${clo.directAttainment.label})\n`;
  });

  csv += '\nStudent-wise CLO Performance\n';
  csv += 'Roll Number,Student Name';
  if (isAllMode) csv += ',Assessments Attempted';
  cloList.forEach(clo => { csv += `,${clo.code} (%),${clo.code} Level`; });
  csv += ',Overall %\n';

  performanceData.students.forEach(student => {
    csv += `"${student.rollNumber}","${student.name}"`;
    if (isAllMode) csv += `,${student.assessmentsAttempted || 0}`;
    cloList.forEach(clo => {
      const perf = student.cloPerformance[clo.id];
      if (perf) {
        const pct = perf.averagePercentage ?? perf.percentage ?? 0;
        const lvl = perf.attainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
        csv += `,${pct.toFixed(1)}%,Level ${lvl}`;
      } else {
        csv += ',N/A,N/A';
      }
    });
    csv += `,${student.totalPercentage.toFixed(1)}%\n`;
  });

  return csv;
};

const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ─── Collapsible Section Wrapper ─────────────────────────────────────────────
const Section = ({ title, icon: Icon, sectionKey, expanded, onToggle, children }) => (
  <>
    <div className="section-header" onClick={() => onToggle(sectionKey)}>
      <h3><Icon size={20} /> {title}</h3>
      {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
    </div>
    {expanded && children}
  </>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const StudentPerformanceAnalysis = ({
  course,
  assessmentId = null,
  onClose,
  standalone = true,
  showHeader = true,
  className = ''
}) => {
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [analysisMode, setAnalysisMode] = useState('all');
  const [isReportSubmitted, setIsReportSubmitted] = useState(false); // New state for submission status
  const analysisModeRef = useRef('all');
  // Store finalized assessments ref for use in combined analysis
  const finalizedAssessmentsRef = useRef([]);

  const [expandedSections, setExpandedSections] = useState({
    assessmentDetails: true,
    quickGlance: true,
    cloWiseAnalysis: true,
    attainmentSummary: true,
    studentPerformance: true
  });

  const setMode = (mode) => {
    analysisModeRef.current = mode;
    setAnalysisMode(mode);
  };

  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  // ─── Check if report already submitted ───────────────────────────────────
  const checkReportSubmissionStatus = useCallback(async () => {
    if (!performanceData || analysisModeRef.current !== 'all') return;
    
    try {
      const assessmentIds = performanceData.assessments?.map(a => a.id) || [];
      const params = new URLSearchParams({
        courseId: performanceData.course.id,
        semester: performanceData.course.semester,
        year: performanceData.course.year
      });
      
      if (assessmentIds.length > 0) {
        params.append('assessmentIds', assessmentIds.join(','));
      }
      
      const response = await facultyApi.checkReportSubmission(params);
      setIsReportSubmitted(response.data.isSubmitted);
    } catch (err) {
      console.error('Error checking report submission status:', err);
      setIsReportSubmitted(false); // Default to false on error
    }
  }, [performanceData]);

  // ─── Data fetching ──────────────────────────────────────────────────────
  const fetchAssessmentMarks = useCallback(async (asmtId, studentsData, closData) => {
    const marksResponse = await assessmentApi.getAssessmentMarks(asmtId);
    const marksData = getResponseData(marksResponse);
    if (!marksData) throw new Error('No marks data received');
    return analyzeCLOPerformance(marksData, studentsData, closData, course);
  }, [course]);

  const fetchAllAssessmentsPerformance = useCallback(async (finalized, studentsData, closData) => {
    const results = await Promise.all(
      finalized.map(a =>
        assessmentApi.getAssessmentMarks(a.id)
          .then(r => getResponseData(r))
          .catch(err => { console.error(`Marks fetch failed for ${a.id}:`, err); return null; })
      )
    );
    const valid = results.filter(d => d && d.students);
    // FIX #1: filter finalized to match valid results (preserve index alignment)
    const validFinalized = finalized.filter((_, i) => results[i] && results[i].students);
    if (valid.length === 0) throw new Error('No valid marks data found for any assessment');
    return combineCLOPerformance(valid, studentsData, closData, course, validFinalized);
  }, [course]);

  const fetchAllData = useCallback(async () => {
    if (!course) { setError('Please select a course'); return; }
    try {
      setLoading(true);
      setError(null);
      setIsReportSubmitted(false); // Reset submission status on new fetch

      const [assessmentsRes, studentsRes, closRes] = await Promise.all([
        assessmentApi.getCourseAssessments(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseClos(course.id)
      ]);

      const assessmentsData = getResponseData(assessmentsRes)?.assessments || [];
      const studentsData = getResponseData(studentsRes)?.students || [];
      const closData = getResponseData(closRes) || [];

      const finalized = assessmentsData.filter(a => a.isMarksFinalized === true);
      setAvailableAssessments(finalized);
      finalizedAssessmentsRef.current = finalized;

      if (finalized.length === 0) { setError('No finalized assessments found for this course'); return; }

      if (assessmentId) {
        const target = finalized.find(a => a.id === assessmentId);
        if (target) {
          setSelectedAssessment(target);
          setMode('single');
          const data = await fetchAssessmentMarks(target.id, studentsData, closData);
          setPerformanceData(data);
        } else {
          setError('Assessment not found or not finalized');
        }
      } else {
        setMode('all');
        const data = await fetchAllAssessmentsPerformance(finalized, studentsData, closData);
        setPerformanceData(data);
      }
    } catch (err) {
      console.error('[PerformanceAnalysis] fetchAllData error:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [course, assessmentId, fetchAssessmentMarks, fetchAllAssessmentsPerformance]);

  // Check submission status when performance data changes
  useEffect(() => {
    if (performanceData && analysisMode === 'all') {
      checkReportSubmissionStatus();
    }
  }, [performanceData, analysisMode, checkReportSubmissionStatus]);

  const handleAssessmentSelect = async (value) => {
    setIsReportSubmitted(false); // Reset submission status
    setError(null);
    setPerformanceData(null);
    setLoading(true);
    try {
      const [studentsRes, closRes] = await Promise.all([
        assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseClos(course.id)
      ]);
      const studentsData = getResponseData(studentsRes)?.students || [];
      const closData = getResponseData(closRes) || [];

      if (value === 'all') {
        setMode('all');
        const data = await fetchAllAssessmentsPerformance(finalizedAssessmentsRef.current, studentsData, closData);
        setPerformanceData(data);
      } else {
        const target = availableAssessments.find(a => a.id === value);
        if (target) {
          setSelectedAssessment(target);
          setMode('single');
          const data = await fetchAssessmentMarks(target.id, studentsData, closData);
          setPerformanceData(data);
        }
      }
    } catch (err) {
      console.error('handleAssessmentSelect error:', err);
      setError('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  // ─── Submit to HOD ──────────────────────────────────────────────────────
  const handleSubmitToHOD = async () => {
    if (!performanceData || analysisModeRef.current !== 'all') return;
    try {
      setSubmitting(true);
      setError(null);
      setSuccessMessage('');

      // FIX #1: assessmentIds now correctly come from performanceData.assessments
      // which is built from finalizedAssessments (real IDs)
      // FIX #2: removed submittedToHodById — backend derives from req.user
      const reportData = {
        reportName: `${performanceData.course.code} - Combined CLO Analysis (Sem ${performanceData.course.semester} ${performanceData.course.year})`,
        reportType: "COMBINED",
        academicYear: `${performanceData.course.year}-${(performanceData.course.year + 1).toString().slice(-2)}`,
        reportParameters: {
          courseId: performanceData.course.id,
          semester: performanceData.course.semester,
          year: performanceData.course.year,
          assessmentIds: performanceData.assessments?.map(a => a.id).filter(Boolean) || []
        }
      };

      console.log('📤 Submitting report payload:', reportData);
      console.log('📋 Assessment IDs:', reportData.reportParameters.assessmentIds);

      await facultyApi.submitReportToHOD(reportData);
      
      // Set submission status to true after successful submission
      setIsReportSubmitted(true);
      
      setSuccessMessage('Report submitted to HOD successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Error submitting report to HOD:', err);
      setError(err.response?.data?.message || 'Failed to submit report to HOD');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Export CSV ─────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!performanceData) return;
    const isAll = analysisModeRef.current === 'all';
    const csv = buildCSV(performanceData, isAll);
    const courseCode = (performanceData.course?.code || 'course').replace(/[^a-z0-9]/gi, '_');
    const suffix = isAll
      ? 'all_assessments'
      : (performanceData.assessment?.title || 'assessment').replace(/[^a-z0-9]/gi, '_');
    downloadBlob(csv, `${courseCode}_clo_analysis_${suffix}.csv`.toLowerCase(), 'text/csv;charset=utf-8;');
  };

  // ─── Export PDF ─────────────────────────────────────────────────────────
  // Pure JS PDF via printable window (no external deps needed)
  const handleExportPDF = () => {
    if (!performanceData) return;
    const isAll = analysisModeRef.current === 'all';
    const cloList = Object.values(performanceData.cloAnalysis);
    const courseCode = performanceData.course.code;
    const courseName = performanceData.course.name;
    const title = isAll
      ? `${courseCode} — Combined CLO Analysis`
      : `${courseCode} — ${performanceData.assessment?.title} CLO Analysis`;

    const cloRows = cloList.map(clo => `
      <tr>
        <td><strong>${clo.code}</strong></td>
        <td>${clo.bloomLevel || 'N/A'}</td>
        <td>${clo.threshold}%</td>
        <td>${clo.statistics.attainedStudents}/${clo.statistics.totalStudents}</td>
        <td>${clo.statistics.classAttainment.toFixed(1)}%</td>
        <td class="level-${clo.directAttainment.level}">Level ${clo.directAttainment.level} (${clo.directAttainment.label})</td>
      </tr>
    `).join('');

    const studentRows = performanceData.students.slice(0, 100).map(student => {
      const cloCells = cloList.map(clo => {
        const perf = student.cloPerformance[clo.id];
        const pct = perf?.averagePercentage ?? perf?.percentage ?? 0;
        const lvl = perf?.attainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
        return `<td>${pct.toFixed(1)}%</td><td>L${lvl}</td>`;
      }).join('');
      return `<tr><td>${student.rollNumber}</td><td>${student.name}</td>${cloCells}<td><strong>${student.totalPercentage.toFixed(1)}%</strong></td></tr>`;
    }).join('');

    const cloHeaders = cloList.map(c => `<th colspan="2">${c.code}</th>`).join('');
    const cloSubHeaders = cloList.map(() => `<th>Score%</th><th>Lvl</th>`).join('');

    const html = `<!DOCTYPE html><html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 20px; }
      h1 { font-size: 16px; color: #1e40af; margin-bottom: 4px; }
      h2 { font-size: 13px; color: #334155; margin: 16px 0 8px; }
      .meta { color: #64748b; font-size: 10px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 10px; }
      th { background: #f1f5f9; padding: 6px 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600; }
      td { padding: 5px 8px; border: 1px solid #e2e8f0; }
      tr:nth-child(even) { background: #f8fafc; }
      .level-3 { color: #0d6832; font-weight: 600; }
      .level-2 { color: #925d00; font-weight: 600; }
      .level-1 { color: #b45a1c; font-weight: 600; }
      .level-0 { color: #ac2c34; font-weight: 600; }
      @media print { body { margin: 0; } }
    </style></head><body>
    <h1>${title}</h1>
    <div class="meta">Course: ${courseCode} — ${courseName} &nbsp;|&nbsp; Semester: ${performanceData.course.semester} &nbsp;|&nbsp; Year: ${performanceData.course.year} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>

    <h2>CLO Attainment Summary</h2>
    <table>
      <thead><tr><th>CLO Code</th><th>Bloom's Level</th><th>Threshold</th><th>Students Attained</th><th>Class Attainment %</th><th>Direct Attainment Level</th></tr></thead>
      <tbody>${cloRows}</tbody>
    </table>

    <h2>Student-wise CLO Performance ${performanceData.students.length > 100 ? '(first 100 students)' : ''}</h2>
    <table>
      <thead>
        <tr><th>Roll No.</th><th>Name</th>${cloHeaders}<th>Overall %</th></tr>
        <tr><th></th><th></th>${cloSubHeaders}<th></th></tr>
      </thead>
      <tbody>${studentRows}</tbody>
    </table>
    </body></html>`;

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Please allow popups for PDF export'); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  useEffect(() => {
    if (course) fetchAllData();
  }, [course, assessmentId, fetchAllData]);

  // ─── Render states ─────────────────────────────────────────────────────
  if (loading) return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      <div className="loading-state"><div className="spinner" /><p>Loading CLO performance data…</p></div>
    </div>
  );

  if (error && !performanceData) return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      <div className="error-state">
        <AlertTriangle size={48} />
        <h3>Analysis Unavailable</h3>
        <p>{error}</p>
        {onClose && <button className="btn btn-outline" onClick={onClose}>Close</button>}
      </div>
    </div>
  );

  if (!performanceData) return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      <div className="empty-state">
        <Target size={64} />
        <h3>No CLO Performance Data Available</h3>
        <p>No finalized assessments found for this course.</p>
      </div>
    </div>
  );

  const cloList = Object.values(performanceData.cloAnalysis);
  const isAllMode = analysisMode === 'all';

  // ─── Main render ────────────────────────────────────────────────────────
  return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>

      {showHeader && (
        <PerformanceHeader
          isAllMode={isAllMode}
          performanceData={performanceData}
          availableAssessments={availableAssessments}
          selectedAssessment={selectedAssessment}
          submitting={submitting}
          isReportSubmitted={isReportSubmitted} // Pass submission status to header
          onAssessmentSelect={handleAssessmentSelect}
          onSubmitToHOD={handleSubmitToHOD}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onClose={onClose}
        />
      )}

      {!showHeader && (
        <div className="actions-bar-no-header">
          {isAllMode && (
            <button 
              className={`btn-submit-hod ${isReportSubmitted ? 'btn-submitted' : ''}`}
              onClick={handleSubmitToHOD} 
              disabled={submitting || isReportSubmitted}
              title={isReportSubmitted ? 'Report already submitted to HOD' : 'Submit to HOD'}
            >
              <span>
                {submitting ? 'Submitting...' : isReportSubmitted ? 'Already Submitted' : 'Submit to HOD'}
              </span>
              {isReportSubmitted && <CheckCircle size={16} className="submitted-check" />}
            </button>
          )}
          <button className="btn-export" onClick={handleExportCSV}><span>Export CSV</span></button>
          <button className="btn-export btn-export-pdf" onClick={handleExportPDF}><span>Export PDF</span></button>
        </div>
      )}

      {successMessage && (
        <div className="success-message"><CheckCircle size={20} /><span>{successMessage}</span></div>
      )}
      {error && performanceData && (
        <div className="error-inline"><AlertTriangle size={20} /><span>{error}</span></div>
      )}

      <div className="analysis-content">
        {/* Course Info Banner */}
        <div className="assessment-info-banner">
          <div className="info-item"><BookOpen size={18} /><span className="label">Course:</span><span className="value">{performanceData.course.code} — {performanceData.course.name}</span></div>
          <div className="info-item"><Users size={18} /><span className="label">Students:</span><span className="value">{performanceData.students.length}</span></div>
          <div className="info-item"><Layers size={18} /><span className="label">CLOs:</span><span className="value">{cloList.length}</span></div>
          {!isAllMode && performanceData.assessment && (
            <>
              <div className="info-item"><Star size={18} /><span className="label">Max Marks:</span><span className="value">{performanceData.assessment.maxMarks}</span></div>
              {performanceData.assessment.duration && (
                <div className="info-item"><Clock size={18} /><span className="label">Duration:</span><span className="value">{performanceData.assessment.duration} mins</span></div>
              )}
            </>
          )}
          {isAllMode && (
            <div className="info-item"><FileText size={18} /><span className="label">Assessments:</span><span className="value">{performanceData.assessments?.length || 0}</span></div>
          )}
        </div>

        <Section title="Assessment Details" icon={FileText} sectionKey="assessmentDetails" expanded={expandedSections.assessmentDetails} onToggle={toggleSection}>
          <div className="assessment-details-section">
            <AssessmentDetails isAllMode={isAllMode} performanceData={performanceData} />
          </div>
        </Section>

        <Section title="Quick Glance: CLO Attainment Dashboard" icon={BarChart} sectionKey="quickGlance" expanded={expandedSections.quickGlance} onToggle={toggleSection}>
          <QuickGlanceDashboard cloList={cloList} />
        </Section>

        <Section title="CLO-wise Attainment Analysis" icon={Target} sectionKey="cloWiseAnalysis" expanded={expandedSections.cloWiseAnalysis} onToggle={toggleSection}>
          <CLOAnalysisSection cloList={cloList} calculateAttainmentLevel={calculateAttainmentLevel} />
        </Section>

        <Section title="CLO Attainment Summary" icon={Award} sectionKey="attainmentSummary" expanded={expandedSections.attainmentSummary} onToggle={toggleSection}>
          <AttainmentSummary cloList={cloList} />
        </Section>

        <Section title="Student-wise CLO Performance" icon={Users} sectionKey="studentPerformance" expanded={expandedSections.studentPerformance} onToggle={toggleSection}>
          <StudentPerformanceTable
            performanceData={performanceData}
            cloList={cloList}
            isAllMode={isAllMode}
            calculateAttainmentLevel={calculateAttainmentLevel}
          />
        </Section>
      </div>
    </div>
  );
};

export default StudentPerformanceAnalysis;