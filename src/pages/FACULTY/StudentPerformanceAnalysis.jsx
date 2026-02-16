// src/components/faculty/StudentPerformanceAnalysis.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart,
  TrendingUp,
  Users,
  Award,
  AlertTriangle,
  CheckCircle,
  Download,
  Filter,
  Target,
  ChevronDown,
  ChevronRight,
  FileText,
  Layers,
  BookOpen,
  Clock,
  Star,
  PieChart
} from 'lucide-react';
import assessmentApi from "../../apis/assessments/assessment";
import "./StudentPerformanceAnalysis.css";

const StudentPerformanceAnalysis = ({
  course,
  assessmentId = null,
  assessments = [],
  onClose,
  standalone = true,
  showHeader = true,
  className = ''
}) => {
  // State Management
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentFilter, setStudentFilter] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'totalPercentage', direction: 'desc' });
  const [analysisMode, setAnalysisMode] = useState('single'); // 'single' or 'all'
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    cloAnalysis: true,
    studentPerformance: true,
    assessmentDetails: true,
    assessmentWise: true
  });
  const [selectedClo, setSelectedClo] = useState(null);

  // Safe array utilities
  const safeArray = (arr) => Array.isArray(arr) ? arr : [];
  const getResponseData = (response) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  // Fetch all necessary data
  const fetchAllData = useCallback(async () => {
    if (!course) {
      setError('Please select a course');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('[PerformanceAnalysis] Fetching all data for course:', course.id);
      
      const [assessmentsResponse, studentsResponse, closResponse] = await Promise.all([
        assessmentApi.getCourseAssessments(course.id, {
          semester: course.semester,
          year: course.year
        }),
        assessmentApi.getCourseStudents(course.id, {
          semester: course.semester,
          year: course.year
        }),
        assessmentApi.getCourseClos(course.id)
      ]);
      
      const assessmentsData = getResponseData(assessmentsResponse)?.assessments || [];
      const studentsData = getResponseData(studentsResponse)?.students || [];
      const closData = getResponseData(closResponse) || [];
      
      const finalizedAssessments = assessmentsData.filter(a => a.isMarksFinalized === true);
      setAvailableAssessments(finalizedAssessments);
      
      // Check if we're in "all assessments" mode
      if (assessmentId === null && finalizedAssessments.length > 0) {
        // Load all assessments
        console.log('[PerformanceAnalysis] Loading all assessments');
        setAnalysisMode('all');
        await fetchAllAssessmentsPerformance(finalizedAssessments, studentsData, closData);
      } else if (assessmentId) {
        // Load specific assessment
        const assessment = finalizedAssessments.find(a => a.id === assessmentId);
        if (assessment) {
          setSelectedAssessment(assessment);
          setAnalysisMode('single');
          await fetchAssessmentMarks(assessment.id, studentsData, closData);
        } else {
          setError('Assessment not found or not finalized');
        }
      } else if (finalizedAssessments.length > 0) {
        // Default to first assessment
        setSelectedAssessment(finalizedAssessments[0]);
        setAnalysisMode('single');
        await fetchAssessmentMarks(finalizedAssessments[0].id, studentsData, closData);
      } else {
        setError('No finalized assessments found for this course');
      }
      
    } catch (err) {
      console.error('[PerformanceAnalysis] Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [course, assessmentId]);

  // Fetch marks for a specific assessment
  const fetchAssessmentMarks = useCallback(async (assessmentId, studentsData, closData) => {
    try {
      const marksResponse = await assessmentApi.getAssessmentMarks(assessmentId);
      const marksData = getResponseData(marksResponse);
      
      if (!marksData) {
        throw new Error('No marks data received');
      }
      
      const analyzedData = analyzePerformance(marksData, studentsData, closData, course);
      setPerformanceData(analyzedData);
      
    } catch (err) {
      console.error('[PerformanceAnalysis] Error fetching marks:', err);
      setError('Failed to load marks data');
    }
  }, [course]);

  // Fetch all assessments performance
  const fetchAllAssessmentsPerformance = useCallback(async (assessments, studentsData, closData) => {
    try {
      setLoading(true);
      
      // Fetch marks for all assessments
      const marksPromises = assessments.map(assessment => 
        assessmentApi.getAssessmentMarks(assessment.id)
          .then(res => getResponseData(res))
          .catch(err => {
            console.error(`Failed to fetch marks for assessment ${assessment.id}:`, err);
            return null;
          })
      );
      
      const marksResults = await Promise.all(marksPromises);
      
      // Filter out failed requests
      const validMarksData = marksResults.filter(data => data && data.students);
      
      if (validMarksData.length === 0) {
        throw new Error('No valid marks data found for any assessment');
      }
      
      // Analyze each assessment
      const analyzedAssessments = validMarksData.map(marksData => 
        analyzePerformance(marksData, studentsData, closData, course)
      ).filter(data => data !== null);
      
      // Combine all assessments
      const combinedData = combineAssessmentsPerformance(analyzedAssessments, course);
      setPerformanceData(combinedData);
      
    } catch (err) {
      console.error('[PerformanceAnalysis] Error fetching all assessments:', err);
      setError('Failed to load all assessments data');
    } finally {
      setLoading(false);
    }
  }, [course]);

  // Analyze performance for a single assessment
  const analyzePerformance = (marksData, studentsData, closData, courseInfo) => {
    if (!marksData || !studentsData) return null;
    
    const marksStudents = marksData.students || [];
    const assessmentClos = marksData.clos || [];
    
    const studentMap = {};
    studentsData.forEach(student => {
      studentMap[student.id] = student;
    });
    
    const cloThresholdMap = {};
    closData.forEach(clo => {
      cloThresholdMap[clo.id] = {
        threshold: clo.attainmentThreshold || 50,
        code: clo.code,
        statement: clo.statement,
        bloomLevel: clo.bloomLevel
      };
    });
    
    const studentPerformance = marksStudents.map(marksStudent => {
      const studentId = marksStudent.studentId;
      const studentInfo = studentMap[studentId] || {};
      const marksByClo = marksStudent.marksByClo || {};
      
      const cloPerformance = {};
      let totalObtained = 0;
      let totalMax = 0;
      
      assessmentClos.forEach(clo => {
        const cloId = clo.id;
        const maxMarks = clo.marksAllocated || 0;
        const marksData = marksByClo[cloId];
        const obtained = marksData ? parseFloat(marksData.marksObtained) || 0 : 0;
        
        const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;
        const threshold = cloThresholdMap[cloId]?.threshold || 50;
        const attained = percentage >= threshold;
        
        cloPerformance[cloId] = {
          obtained,
          maxMarks,
          percentage,
          threshold,
          attained,
          code: cloThresholdMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0,4)}`,
          statement: cloThresholdMap[cloId]?.statement || clo.statement || ''
        };
        
        totalObtained += obtained;
        totalMax += maxMarks;
      });
      
      const totalPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      
      return {
        studentId,
        rollNumber: marksStudent.rollNumber || studentInfo.rollNumber || 'N/A',
        name: marksStudent.name || studentInfo.name || 'Unknown',
        cloPerformance,
        totalObtained,
        totalMax,
        totalPercentage,
        overallAttained: Object.values(cloPerformance).every(clo => clo.attained)
      };
    });
    
    const statistics = {
      totalStudents: studentPerformance.length,
      studentsAboveThreshold: studentPerformance.filter(s => s.overallAttained).length,
      cloStatistics: {},
      classAverage: 0,
      maxScore: 0,
      minScore: 100
    };
    
    assessmentClos.forEach(clo => {
      const cloId = clo.id;
      const scores = studentPerformance
        .map(s => s.cloPerformance[cloId]?.percentage || 0)
        .filter(s => s > 0);
      
      statistics.cloStatistics[cloId] = {
        code: cloThresholdMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0,4)}`,
        maxMarks: clo.marksAllocated || 0,
        average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        threshold: cloThresholdMap[cloId]?.threshold || 50,
        studentsAttained: scores.filter(s => s >= (cloThresholdMap[cloId]?.threshold || 50)).length,
        totalStudents: scores.length,
        bloomLevel: cloThresholdMap[cloId]?.bloomLevel || clo.bloomLevel || ''
      };
    });
    
    const percentages = studentPerformance.map(s => s.totalPercentage);
    statistics.classAverage = percentages.length > 0 
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length 
      : 0;
    statistics.maxScore = Math.max(...percentages, 0);
    statistics.minScore = Math.min(...percentages, 100);
    
    return {
      assessment: {
        id: marksData.assessment?.id || marksData.id,
        title: marksData.assessment?.title || marksData.title || 'Assessment',
        type: marksData.assessment?.type || marksData.type,
        maxMarks: marksData.assessment?.maxMarks || marksData.maxMarks,
        totalQuestions: marksData.assessment?.totalQuestions || marksData.totalQuestions,
        duration: marksData.assessment?.duration || marksData.duration,
        isMarksFinalized: true,
        conductedOn: marksData.assessment?.conductedOn || marksData.conductedOn
      },
      course: {
        id: courseInfo.id,
        code: courseInfo.code,
        name: courseInfo.name,
        credits: courseInfo.credits,
        semester: courseInfo.semester,
        year: courseInfo.year
      },
      clos: assessmentClos.map(clo => ({
        id: clo.id,
        code: cloThresholdMap[clo.id]?.code || clo.code || `CLO-${clo.id.slice(0,4)}`,
        statement: cloThresholdMap[clo.id]?.statement || clo.statement || '',
        bloomLevel: cloThresholdMap[clo.id]?.bloomLevel || clo.bloomLevel || '',
        maxMarks: clo.marksAllocated || 0,
        threshold: cloThresholdMap[clo.id]?.threshold || 50
      })),
      students: studentPerformance,
      statistics,
      generatedAt: new Date().toISOString()
    };
  };

  // Combine multiple assessment results
  const combineAssessmentsPerformance = (assessmentsData, courseInfo) => {
    if (!assessmentsData || assessmentsData.length === 0) return null;
    
    const combined = {
      assessments: assessmentsData.map(a => a.assessment),
      course: courseInfo,
      clos: [],
      students: [],
      statistics: {
        totalStudents: 0,
        studentsAboveThreshold: 0,
        cloStatistics: {},
        classAverage: 0,
        maxScore: 0,
        minScore: 100,
        totalAssessments: assessmentsData.length,
        assessmentWiseStats: []
      },
      assessmentWiseData: assessmentsData,
      generatedAt: new Date().toISOString()
    };
    
    // Combine all unique CLOs
    const cloMap = new Map();
    assessmentsData.forEach(data => {
      data.clos.forEach(clo => {
        if (!cloMap.has(clo.id)) {
          cloMap.set(clo.id, clo);
        }
      });
    });
    combined.clos = Array.from(cloMap.values());
    
    // Combine student data
    const studentMap = new Map();
    
    assessmentsData.forEach((assessmentData, index) => {
      assessmentData.students.forEach(student => {
        if (!studentMap.has(student.studentId)) {
          studentMap.set(student.studentId, {
            studentId: student.studentId,
            rollNumber: student.rollNumber,
            name: student.name,
            cloPerformance: {},
            totalObtained: 0,
            totalMax: 0,
            assessmentsAttempted: 0,
            assessmentsAttained: 0,
            assessmentScores: []
          });
        }
        
        const existingStudent = studentMap.get(student.studentId);
        
        // Store individual assessment scores
        existingStudent.assessmentScores.push({
          assessmentId: assessmentData.assessment.id,
          assessmentTitle: assessmentData.assessment.title,
          totalPercentage: student.totalPercentage,
          obtained: student.totalObtained,
          maxMarks: student.totalMax,
          attained: student.overallAttained
        });
        
        // Merge CLO performance
        Object.entries(student.cloPerformance).forEach(([cloId, perf]) => {
          if (!existingStudent.cloPerformance[cloId]) {
            existingStudent.cloPerformance[cloId] = {
              obtained: 0,
              maxMarks: 0,
              assessmentsCount: 0,
              attainedCount: 0,
              percentages: []
            };
          }
          
          existingStudent.cloPerformance[cloId].obtained += perf.obtained;
          existingStudent.cloPerformance[cloId].maxMarks += perf.maxMarks;
          existingStudent.cloPerformance[cloId].assessmentsCount += 1;
          existingStudent.cloPerformance[cloId].percentages.push(perf.percentage);
          if (perf.attained) {
            existingStudent.cloPerformance[cloId].attainedCount += 1;
          }
        });
        
        existingStudent.totalObtained += student.totalObtained;
        existingStudent.totalMax += student.totalMax;
        existingStudent.assessmentsAttempted += 1;
        if (student.overallAttained) {
          existingStudent.assessmentsAttained += 1;
        }
      });
    });
    
    // Process combined student data
    combined.students = Array.from(studentMap.values()).map(student => {
      const cloPerformance = {};
      Object.entries(student.cloPerformance).forEach(([cloId, data]) => {
        const avgPercentage = data.maxMarks > 0 ? (data.obtained / data.maxMarks) * 100 : 0;
        const attainmentRate = data.assessmentsCount > 0 ? (data.attainedCount / data.assessmentsCount) * 100 : 0;
        
        cloPerformance[cloId] = {
          obtained: data.obtained,
          maxMarks: data.maxMarks,
          percentage: avgPercentage,
          threshold: 50,
          attained: attainmentRate >= 70, // Student attains CLO if they meet threshold in 70% of assessments
          code: combined.clos.find(c => c.id === cloId)?.code || cloId,
          assessmentsCount: data.assessmentsCount,
          attainedCount: data.attainedCount,
          attainmentRate,
          percentages: data.percentages
        };
      });
      
      const totalPercentage = student.totalMax > 0 ? (student.totalObtained / student.totalMax) * 100 : 0;
      const overallAttained = student.assessmentsAttempted > 0 ? 
        (student.assessmentsAttained / student.assessmentsAttempted) >= 0.7 : false;
      
      return {
        ...student,
        cloPerformance,
        totalPercentage,
        overallAttained,
        assessmentsAttempted: student.assessmentsAttempted,
        assessmentsAttained: student.assessmentsAttained
      };
    });
    
    // Calculate statistics
    combined.statistics.totalStudents = combined.students.length;
    combined.statistics.studentsAboveThreshold = combined.students.filter(s => s.overallAttained).length;
    
    combined.clos.forEach(clo => {
      const cloId = clo.id;
      const scores = combined.students
        .map(s => s.cloPerformance[cloId]?.percentage || 0)
        .filter(s => s > 0);
      const attainmentRates = combined.students
        .map(s => s.cloPerformance[cloId]?.attainmentRate || 0)
        .filter(r => r > 0);
      
      combined.statistics.cloStatistics[cloId] = {
        code: clo.code,
        average: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
        threshold: clo.threshold || 50,
        studentsAttained: combined.students.filter(s => s.cloPerformance[cloId]?.attainmentRate >= 70).length,
        totalStudents: scores.length,
        bloomLevel: clo.bloomLevel || '',
        averageAttainmentRate: attainmentRates.length > 0 ? 
          attainmentRates.reduce((a, b) => a + b, 0) / attainmentRates.length : 0
      };
    });
    
    // Calculate assessment-wise statistics
    combined.statistics.assessmentWiseStats = assessmentsData.map(data => ({
      title: data.assessment.title,
      classAverage: data.statistics.classAverage,
      studentsAttained: data.statistics.studentsAboveThreshold,
      totalStudents: data.statistics.totalStudents,
      maxScore: data.statistics.maxScore,
      minScore: data.statistics.minScore
    }));
    
    const percentages = combined.students.map(s => s.totalPercentage);
    combined.statistics.classAverage = percentages.length > 0 
      ? percentages.reduce((a, b) => a + b, 0) / percentages.length 
      : 0;
    combined.statistics.maxScore = Math.max(...percentages, 0);
    combined.statistics.minScore = Math.min(...percentages, 100);
    
    return combined;
  };

  // Sort students
  const getSortedStudents = useMemo(() => {
    if (!performanceData?.students) return [];
    
    return [...performanceData.students].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.key) {
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'rollNumber':
          aVal = a.rollNumber;
          bVal = b.rollNumber;
          break;
        case 'totalPercentage':
          aVal = a.totalPercentage;
          bVal = b.totalPercentage;
          break;
        case 'assessmentsAttained':
          aVal = a.assessmentsAttained;
          bVal = b.assessmentsAttained;
          break;
        default:
          aVal = a.totalPercentage;
          bVal = b.totalPercentage;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [performanceData, sortConfig]);

  // Filter students
  const getFilteredStudents = useMemo(() => {
    if (!studentFilter.trim()) return getSortedStudents;
    
    const filterLower = studentFilter.toLowerCase();
    return getSortedStudents.filter(s => 
      s.name.toLowerCase().includes(filterLower) ||
      s.rollNumber.toLowerCase().includes(filterLower)
    );
  }, [getSortedStudents, studentFilter]);

  // Handle assessment selection
  const handleAssessmentSelect = async (assessmentId) => {
    if (assessmentId === 'all') {
      setAnalysisMode('all');
      setPerformanceData(null);
      setLoading(true);
      
      try {
        const [studentsResponse, closResponse] = await Promise.all([
          assessmentApi.getCourseStudents(course.id, {
            semester: course.semester,
            year: course.year
          }),
          assessmentApi.getCourseClos(course.id)
        ]);
        
        const studentsData = getResponseData(studentsResponse)?.students || [];
        const closData = getResponseData(closResponse) || [];
        
        await fetchAllAssessmentsPerformance(availableAssessments, studentsData, closData);
      } catch (err) {
        console.error('Error loading all assessments:', err);
        setError('Failed to load all assessments data');
      } finally {
        setLoading(false);
      }
    } else {
      const assessment = availableAssessments.find(a => a.id === assessmentId);
      if (assessment) {
        setSelectedAssessment(assessment);
        setAnalysisMode('single');
        setPerformanceData(null);
        setLoading(true);
        
        try {
          const [studentsResponse, closResponse] = await Promise.all([
            assessmentApi.getCourseStudents(course.id, {
              semester: course.semester,
              year: course.year
            }),
            assessmentApi.getCourseClos(course.id)
          ]);
          
          const studentsData = getResponseData(studentsResponse)?.students || [];
          const closData = getResponseData(closResponse) || [];
          
          await fetchAssessmentMarks(assessment.id, studentsData, closData);
        } catch (err) {
          console.error('Error selecting assessment:', err);
          setError('Failed to load assessment data');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!performanceData) return;
    
    let csv = 'Roll Number,Student Name,';
    
    if (analysisMode === 'all') {
      performanceData.assessments.forEach(assessment => {
        csv += `${assessment.title} (%),`;
      });
    }
    
    performanceData.clos.forEach(clo => {
      csv += `${clo.code} (%),`;
    });
    
    if (analysisMode === 'all') {
      csv += 'Assessments Attempted,Assessments Attained,Attainment Rate,';
    }
    
    csv += 'Overall Percentage,Overall Status\n';
    
    performanceData.students.forEach(student => {
      csv += `${student.rollNumber},${student.name},`;
      
      if (analysisMode === 'all') {
        student.assessmentScores.forEach(score => {
          csv += `${score.totalPercentage.toFixed(1)},`;
        });
      }
      
      performanceData.clos.forEach(clo => {
        const perf = student.cloPerformance[clo.id];
        csv += `${perf?.percentage?.toFixed(1) || 0},`;
      });
      
      if (analysisMode === 'all') {
        csv += `${student.assessmentsAttempted},`;
        csv += `${student.assessmentsAttained},`;
        const rate = student.assessmentsAttempted ? 
          ((student.assessmentsAttained / student.assessmentsAttempted) * 100).toFixed(1) : 0;
        csv += `${rate}%,`;
      }
      
      csv += `${student.totalPercentage.toFixed(1)}%,`;
      csv += `${student.overallAttained ? 'Met' : 'Not Met'}\n`;
    });
    
    // Add summary
    csv += '\n--- Summary ---\n';
    csv += `Class Average,${performanceData.statistics.classAverage.toFixed(1)}%\n`;
    csv += `Students Meeting Threshold,${performanceData.statistics.studentsAboveThreshold}/${performanceData.statistics.totalStudents}\n`;
    csv += `Performance Range,${performanceData.statistics.minScore.toFixed(0)}% - ${performanceData.statistics.maxScore.toFixed(0)}%\n`;
    
    if (analysisMode === 'all') {
      csv += `Total Assessments Analyzed,${performanceData.assessments.length}\n`;
    }
    
    const fileName = analysisMode === 'all' 
      ? `${performanceData.course.code}_all_assessments.csv`
      : `${performanceData.course.code}_${performanceData.assessment.title}.csv`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Initial data fetch
  useEffect(() => {
    if (course) {
      fetchAllData();
    }
  }, [course, assessmentId, fetchAllData]);

  // Render loading state
  if (loading) {
    return (
      <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
        {showHeader && (
          <div className="analysis-header">
            <h2><BarChart size={24} /> Student Performance Analysis</h2>
          </div>
        )}
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
        {showHeader && (
          <div className="analysis-header">
            <h2><BarChart size={24} /> Student Performance Analysis</h2>
          </div>
        )}
        <div className="error-state">
          <AlertTriangle size={48} />
          <h3>Analysis Unavailable</h3>
          <p>{error}</p>
          {onClose && (
            <button className="btn btn-outline" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render no data state
  if (!performanceData) {
    return (
      <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
        {showHeader && (
          <div className="analysis-header">
            <h2><BarChart size={24} /> Student Performance Analysis</h2>
            {onClose && (
              <button className="btn-close" onClick={onClose}>×</button>
            )}
          </div>
        )}
        <div className="empty-state">
          <Target size={64} />
          <h3>No Performance Data Available</h3>
          <p>No finalized assessments found for this course.</p>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      {showHeader && (
        <div className="analysis-header">
          <div className="header-title">
            <h2>
              <BarChart size={24} /> 
              {analysisMode === 'all' ? (
                <>Combined Analysis: All Assessments ({performanceData.assessments.length})</>
              ) : (
                <>Performance Analysis: {performanceData.assessment.title}</>
              )}
            </h2>
            {analysisMode === 'all' ? (
              <span className="finalized-badge multi-assessment">
                <Layers size={16} /> Combined Analysis
              </span>
            ) : (
              <span className="finalized-badge">
                <CheckCircle size={16} /> Finalized Assessment
              </span>
            )}
          </div>
          <div className="header-actions">
            {availableAssessments.length > 0 && (
              <div className="assessment-selector-header">
                <select
                  className="form-control-sm"
                  value={analysisMode === 'all' ? 'all' : (selectedAssessment?.id || '')}
                  onChange={(e) => handleAssessmentSelect(e.target.value)}
                >
                  <option value="" disabled>Select assessment</option>
                  {availableAssessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                  {availableAssessments.length > 1 && (
                    <option value="all">📊 All Assessments Combined</option>
                  )}
                </select>
              </div>
            )}
            
            <button className="btn-export" onClick={exportToCSV} title="Export to CSV">
              <Download size={18} />
              Export
            </button>
            {onClose && (
              <button className="btn-close" onClick={onClose}>×</button>
            )}
          </div>
        </div>
      )}

      <div className="analysis-content">
        {/* Assessment Info Banner */}
        <div className="assessment-info-banner">
          <div className="info-item">
            <BookOpen size={18} />
            <span className="label">Course:</span>
            <span className="value">{performanceData.course.code} - {performanceData.course.name}</span>
          </div>
          {analysisMode === 'single' ? (
            <>
              <div className="info-item">
                <FileText size={18} />
                <span className="label">Assessment Type:</span>
                <span className="value">{performanceData.assessment.type || 'N/A'}</span>
              </div>
              <div className="info-item">
                <Star size={18} />
                <span className="label">Total Marks:</span>
                <span className="value">{performanceData.assessment.maxMarks}</span>
              </div>
              <div className="info-item">
                <Clock size={18} />
                <span className="label">Duration:</span>
                <span className="value">{performanceData.assessment.duration || 'N/A'} mins</span>
              </div>
            </>
          ) : (
            <>
              <div className="info-item">
                <Layers size={18} />
                <span className="label">Assessments Analyzed:</span>
                <span className="value">{performanceData.assessments.length}</span>
              </div>
              <div className="info-item">
                <Users size={18} />
                <span className="label">Total Students:</span>
                <span className="value">{performanceData.statistics.totalStudents}</span>
              </div>
            </>
          )}
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card" onClick={() => toggleSection('summary')}>
            <div className="card-header">
              <TrendingUp size={20} />
              <h3>Overall Average</h3>
              {expandedSections.summary ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            <div className="card-value">{performanceData.statistics.classAverage.toFixed(1)}%</div>
          </div>

          <div className="summary-card" onClick={() => toggleSection('summary')}>
            <div className="card-header">
              <Users size={20} />
              <h3>Students Meeting Threshold</h3>
            </div>
            <div className="card-value">
              {performanceData.statistics.studentsAboveThreshold}/{performanceData.statistics.totalStudents}
            </div>
            <div className="card-subtext">
              {((performanceData.statistics.studentsAboveThreshold / performanceData.statistics.totalStudents) * 100).toFixed(1)}%
            </div>
          </div>

          <div className="summary-card" onClick={() => toggleSection('summary')}>
            <div className="card-header">
              <Award size={20} />
              <h3>Performance Range</h3>
            </div>
            <div className="card-value">
              {performanceData.statistics.minScore.toFixed(0)}% - {performanceData.statistics.maxScore.toFixed(0)}%
            </div>
          </div>

          <div className="summary-card" onClick={() => toggleSection('summary')}>
            <div className="card-header">
              <Target size={20} />
              <h3>CLOs Assessed</h3>
            </div>
            <div className="card-value">{performanceData.clos.length}</div>
          </div>
        </div>

        {/* Detailed Summary Table */}
        {expandedSections.summary && (
          <div className="detailed-summary">
            <h3>Detailed Performance Summary</h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Students</td>
                  <td>{performanceData.statistics.totalStudents}</td>
                  <td>Number of students who attempted the assessment(s)</td>
                </tr>
                <tr>
                  <td>Overall Class Average</td>
                  <td>{performanceData.statistics.classAverage.toFixed(1)}%</td>
                  <td>Mean score across all students and assessments</td>
                </tr>
                <tr>
                  <td>Highest Score</td>
                  <td>{performanceData.statistics.maxScore.toFixed(1)}%</td>
                  <td>Maximum score achieved</td>
                </tr>
                <tr>
                  <td>Lowest Score</td>
                  <td>{performanceData.statistics.minScore.toFixed(1)}%</td>
                  <td>Minimum score achieved</td>
                </tr>
                <tr>
                  <td>Students Above Threshold</td>
                  <td>{performanceData.statistics.studentsAboveThreshold}/{performanceData.statistics.totalStudents}</td>
                  <td>{((performanceData.statistics.studentsAboveThreshold / performanceData.statistics.totalStudents) * 100).toFixed(1)}% of students met all CLO thresholds</td>
                </tr>
                {analysisMode === 'all' && (
                  <tr>
                    <td>Total Assessments</td>
                    <td>{performanceData.assessments.length}</td>
                    <td>Number of assessments included in analysis</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Assessment-wise Summary (for All Assessments mode) */}
        {analysisMode === 'all' && expandedSections.summary && (
          <div className="assessment-wise-summary">
            <h4>Assessment-wise Performance</h4>
            <table className="assessment-wise-table">
              <thead>
                <tr>
                  <th>Assessment</th>
                  <th>Class Average</th>
                  <th>Students Attained</th>
                  <th>Attainment Rate</th>
                  <th>Range</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.assessmentWiseData.map((data, index) => (
                  <tr key={index}>
                    <td><strong>{data.assessment.title}</strong></td>
                    <td>{data.statistics.classAverage.toFixed(1)}%</td>
                    <td>{data.statistics.studentsAboveThreshold}/{data.statistics.totalStudents}</td>
                    <td>
                      {((data.statistics.studentsAboveThreshold / data.statistics.totalStudents) * 100).toFixed(1)}%
                    </td>
                    <td>{data.statistics.minScore.toFixed(0)}% - {data.statistics.maxScore.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CLO Analysis Section */}
        <div className="section-header" onClick={() => toggleSection('cloAnalysis')}>
          <h3><Target size={20} /> Course Learning Outcomes Analysis</h3>
          {expandedSections.cloAnalysis ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.cloAnalysis && (
          <div className="clo-analysis-section">
            <table className="clo-table">
              <thead>
                <tr>
                  <th>CLO Code</th>
                  <th>Description</th>
                  <th>Bloom's Level</th>
                  <th>Threshold</th>
                  <th>Class Average</th>
                  <th>Students Attained</th>
                  <th>Attainment Rate</th>
                  {analysisMode === 'all' && <th>Avg. Attainment Rate</th>}
                </tr>
              </thead>
              <tbody>
                {performanceData.clos.map(clo => {
                  const stats = performanceData.statistics.cloStatistics[clo.id];
                  const attainmentRate = stats ? (stats.studentsAttained / stats.totalStudents) * 100 : 0;
                  
                  return (
                    <tr 
                      key={clo.id} 
                      className={attainmentRate >= 70 ? 'high-attainment' : attainmentRate >= 50 ? 'medium-attainment' : 'low-attainment'}
                      onClick={() => setSelectedClo(selectedClo === clo.id ? null : clo.id)}
                    >
                      <td><strong>{clo.code}</strong></td>
                      <td title={clo.statement}>{clo.statement?.substring(0, 60)}...</td>
                      <td>{clo.bloomLevel || 'N/A'}</td>
                      <td>{clo.threshold}%</td>
                      <td>{stats?.average.toFixed(1)}%</td>
                      <td>{stats?.studentsAttained}/{stats?.totalStudents}</td>
                      <td>
                        <div className="attainment-cell">
                          <span>{attainmentRate.toFixed(1)}%</span>
                          <div className="attainment-bar">
                            <div 
                              className="attainment-progress"
                              style={{ width: `${attainmentRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      {analysisMode === 'all' && (
                        <td>{stats?.averageAttainmentRate?.toFixed(1) || 0}%</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* CLO Details for selected CLO */}
            {selectedClo && analysisMode === 'all' && (
              <div className="clo-details-panel">
                <h4>CLO {performanceData.clos.find(c => c.id === selectedClo)?.code} - Detailed Performance</h4>
                <table className="clo-details-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Roll No.</th>
                      {performanceData.assessments.map(assessment => (
                        <th key={assessment.id}>{assessment.title}</th>
                      ))}
                      <th>Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.students.slice(0, 10).map(student => {
                      const cloPerf = student.cloPerformance[selectedClo];
                      return (
                        <tr key={student.studentId}>
                          <td>{student.name}</td>
                          <td>{student.rollNumber}</td>
                          {cloPerf?.percentages?.map((pct, idx) => (
                            <td key={idx} className={pct >= 50 ? 'attained-cell' : 'not-attained-cell'}>
                              {pct.toFixed(1)}%
                            </td>
                          ))}
                          <td className={cloPerf?.attained ? 'attained-cell' : 'not-attained-cell'}>
                            <strong>{cloPerf?.percentage.toFixed(1)}%</strong>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {performanceData.students.length > 10 && (
                  <p className="more-students-note">Showing 10 of {performanceData.students.length} students</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Student Performance Section */}
        <div className="section-header" onClick={() => toggleSection('studentPerformance')}>
          <h3><Users size={20} /> Student Performance Details</h3>
          {expandedSections.studentPerformance ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.studentPerformance && (
          <div className="student-performance-section">
            <div className="table-controls">
              <div className="search-box">
                <Filter size={18} />
                <input
                  type="text"
                  placeholder="Search by name or roll number..."
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                />
              </div>
              
              <div className="sort-controls">
                <span>Sort by: </span>
                <select
                  value={sortConfig.key}
                  onChange={(e) => setSortConfig({ key: e.target.value, direction: 'desc' })}
                >
                  <option value="totalPercentage">Overall Percentage</option>
                  <option value="name">Name</option>
                  <option value="rollNumber">Roll Number</option>
                  {analysisMode === 'all' && (
                    <option value="assessmentsAttained">Assessments Attained</option>
                  )}
                </select>
                <button
                  className="sort-direction"
                  onClick={() => setSortConfig(prev => ({
                    ...prev,
                    direction: prev.direction === 'asc' ? 'desc' : 'asc'
                  }))}
                >
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="student-table-container">
              <table className="student-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    {analysisMode === 'all' && (
                      <th>Assessments</th>
                    )}
                    {performanceData.clos.map(clo => (
                      <th key={clo.id} title={clo.statement}>
                        {clo.code}
                      </th>
                    ))}
                    <th>Overall</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredStudents.map(student => (
                    <tr key={student.studentId} className={student.overallAttained ? 'attained-row' : 'not-attained-row'}>
                      <td>{student.rollNumber}</td>
                      <td>{student.name}</td>
                      {analysisMode === 'all' && (
                        <td>
                          <span className="assessment-count">
                            {student.assessmentsAttained}/{student.assessmentsAttempted}
                          </span>
                          <small className="attainment-rate">
                            ({((student.assessmentsAttained / student.assessmentsAttempted) * 100).toFixed(0)}%)
                          </small>
                        </td>
                      )}
                      {performanceData.clos.map(clo => {
                        const perf = student.cloPerformance[clo.id];
                        return (
                          <td key={clo.id} className={perf?.attained ? 'attained' : 'not-attained'}>
                            <div className="clo-score">
                              <span className="percentage">{perf?.percentage.toFixed(1)}%</span>
                              {analysisMode === 'all' && perf?.assessmentsCount > 1 && (
                                <small className="count">({perf.assessmentsCount} assessments)</small>
                              )}
                            </div>
                          </td>
                        );
                      })}
                      <td>
                        <strong>{student.totalPercentage.toFixed(1)}%</strong>
                      </td>
                      <td>
                        {student.overallAttained ? (
                          <span className="status-badge success">
                            <CheckCircle size={14} /> Met
                          </span>
                        ) : (
                          <span className="status-badge warning">
                            <AlertTriangle size={14} /> Not Met
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {getFilteredStudents.length === 0 && (
              <div className="no-results">
                <AlertTriangle size={32} />
                <p>No students match your search</p>
              </div>
            )}
          </div>
        )}

        {/* Assessment Details Section */}
        <div className="section-header" onClick={() => toggleSection('assessmentDetails')}>
          <h3><FileText size={20} /> Assessment Details</h3>
          {expandedSections.assessmentDetails ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>

        {expandedSections.assessmentDetails && (
          <div className="assessment-details-section">
            {analysisMode === 'single' ? (
              // Single assessment view
              <>
                <div className="details-grid">
                  <div className="detail-item">
                    <h4>Assessment Information</h4>
                    <table className="details-table">
                      <tbody>
                        <tr>
                          <td>Title:</td>
                          <td><strong>{performanceData.assessment.title}</strong></td>
                        </tr>
                        <tr>
                          <td>Type:</td>
                          <td>{performanceData.assessment.type || 'N/A'}</td>
                        </tr>
                        <tr>
                          <td>Total Marks:</td>
                          <td>{performanceData.assessment.maxMarks}</td>
                        </tr>
                        <tr>
                          <td>Duration:</td>
                          <td>{performanceData.assessment.duration || 'N/A'} minutes</td>
                        </tr>
                        <tr>
                          <td>Conducted On:</td>
                          <td>{performanceData.assessment.conductedOn ? new Date(performanceData.assessment.conductedOn).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                        <tr>
                          <td>Status:</td>
                          <td><span className="finalized-tag">Finalized</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="detail-item">
                    <h4>Marks Distribution by CLO</h4>
                    <table className="marks-table">
                      <thead>
                        <tr>
                          <th>CLO</th>
                          <th>Max Marks</th>
                          <th>Weightage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.clos.map(clo => (
                          <tr key={clo.id}>
                            <td>{clo.code}</td>
                            <td>{clo.maxMarks}</td>
                            <td>{((clo.maxMarks / performanceData.assessment.maxMarks) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td><strong>Total</strong></td>
                          <td><strong>{performanceData.assessment.maxMarks}</strong></td>
                          <td><strong>100%</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                <div className="performance-distribution">
                  <h4>Performance Distribution</h4>
                  <div className="distribution-bars">
                    {['0-20', '21-40', '41-60', '61-80', '81-100'].map(range => {
                      const [min, max] = range.split('-').map(Number);
                      const count = performanceData.students.filter(s => 
                        s.totalPercentage >= min && s.totalPercentage <= max
                      ).length;
                      const percentage = (count / performanceData.students.length) * 100;
                      
                      return (
                        <div key={range} className="distribution-item">
                          <span className="range-label">{range}%</span>
                          <div className="distribution-bar">
                            <div 
                              className="bar-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="count-label">{count} students ({percentage.toFixed(1)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              // All assessments view
              <div className="all-assessments-details">
                <h4>All Assessments Overview</h4>
                <div className="assessments-grid">
                  {performanceData.assessmentWiseData.map((data, index) => (
                    <div key={index} className="assessment-card">
                      <h5>{data.assessment.title}</h5>
                      <div className="assessment-card-stats">
                        <div className="stat">
                          <span className="label">Type:</span>
                          <span className="value">{data.assessment.type || 'N/A'}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Max Marks:</span>
                          <span className="value">{data.assessment.maxMarks}</span>
                        </div>
                        <div className="stat">
                          <span className="label">Class Average:</span>
                          <span className="value">{data.statistics.classAverage.toFixed(1)}%</span>
                        </div>
                        <div className="stat">
                          <span className="label">Attainment:</span>
                          <span className="value">
                            {((data.statistics.studentsAboveThreshold / data.statistics.totalStudents) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="clo-coverage">
                  <h4>CLO Coverage Across Assessments</h4>
                  <table className="coverage-table">
                    <thead>
                      <tr>
                        <th>CLO</th>
                        {performanceData.assessments.map(assessment => (
                          <th key={assessment.id}>{assessment.title}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {performanceData.clos.map(clo => {
                        const stats = performanceData.statistics.cloStatistics[clo.id];
                        return (
                          <tr key={clo.id}>
                            <td><strong>{clo.code}</strong></td>
                            {performanceData.assessmentWiseData.map(data => {
                              const hasClo = data.clos.some(c => c.id === clo.id);
                              return (
                                <td key={data.assessment.id} className={hasClo ? 'covered' : 'not-covered'}>
                                  {hasClo ? '✓' : '✗'}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentPerformanceAnalysis;