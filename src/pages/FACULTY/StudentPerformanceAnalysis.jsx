// src/components/faculty/StudentPerformanceAnalysis.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Users, Award, AlertTriangle, CheckCircle,
  Target, ChevronDown, ChevronRight, FileText, Layers,
  BookOpen, Clock, Star, Upload, Users as UsersIcon
} from 'lucide-react';
import assessmentApi from "../../apis/assessments/assessment";
import facultyApi from "../../apis/faculty";
import HODAPI from '../../apis/HOD';
import PerformanceHeader from './Performance/PerformanceHeader';
import AssessmentDetails from './Performance/AssessmentDetails';
import CLOAnalysisSection from './Performance/CLOAnalysisSection';
import QuickGlanceDashboard from './Performance/QuickGlanceDashboard';
import StudentPerformanceTable from './Performance/StudentPerformanceTable';
import AttainmentSummary from './Performance/AttainmentSummary';
import IndirectAssessmentPanel from './Performance/IndirectAssessmentPanel';
import './Performance/IndirectAssessmentPanel.css';

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

const classAttainmentToLevel = (pct) => {
  if (pct >= 60) return 3;
  if (pct >= 50) return 2;
  if (pct >= 40) return 1;
  return 0;
};

const levelLabel = (l) => ['Not Attained', 'Low', 'Medium', 'High'][l] ?? 'N/A';

// ─── Faculty data fetching ───────────────────────────────────────────────────
const fetchAssignedFaculties = async (courseId, semester, year) => {
  try {
    const facRes = await HODAPI.assignments.getCourseAssignments(
      courseId,
      String(semester),
      String(year)
    );
    
    let assignmentsData = [];
    if (Array.isArray(facRes.data)) {
      assignmentsData = facRes.data;
    } else if (facRes.data?.assignments && Array.isArray(facRes.data.assignments)) {
      assignmentsData = facRes.data.assignments;
    } else if (facRes.data?.data?.assignments && Array.isArray(facRes.data.data.assignments)) {
      assignmentsData = facRes.data.data.assignments;
    }
    
    return assignmentsData.map(f => ({
      name: f.faculty?.name || f.facultyName || 'Unknown',
      email: f.faculty?.user?.email || '',
      isCoordinator: f.isCourseCoordinator || false
    }));
  } catch (err) {
    if (err.response?.status === 404) {
      return []; // No faculty assigned
    }
    console.error('Error fetching assignments:', err);
    return [];
  }
};

// ─── Indirect analysis ────────────────────────────────────────────────────────
const analyzeIndirectAssessment = (rawData, closData) => {
  if (!Array.isArray(rawData) || !rawData.length) return null;
  const cloMap = {};
  closData.forEach(c => { cloMap[c.id] = c; });
  const byClo = {};
  rawData.forEach(entry => {
    if (!byClo[entry.cloId]) byClo[entry.cloId] = [];
    byClo[entry.cloId].push(entry);
  });
  const result = {};
  Object.entries(byClo).forEach(([cloId, entries]) => {
    const cloInfo = entries[0].clo;
    const clo = cloMap[cloId] || {};
    const threshold = clo.attainmentThreshold || cloInfo?.attainmentThreshold || 50;
    const attainThresholdRating = (threshold / 100) * 5;
    const totalStudents = entries.length;
    const attainedStudents = entries.filter(e => e.rating >= attainThresholdRating).length;
    const classAttainmentPct = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
    const level = classAttainmentToLevel(classAttainmentPct);
    const averageRating = totalStudents > 0 ? entries.reduce((s, e) => s + e.rating, 0) / totalStudents : 0;
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach(e => { const r = Math.round(e.rating); if (r >= 1 && r <= 5) distribution[r]++; });
    result[cloId] = {
      id: cloId, code: cloInfo?.code || '', statement: cloInfo?.statement || '',
      bloomLevel: cloInfo?.bloomLevel || '', threshold,
      statistics: {
        totalStudents, attainedStudents, classAttainment: classAttainmentPct,
        averageRating, distribution,
        studentRatings: entries.map(e => ({ studentId: e.student?.id, rollNumber: e.student?.rollNumber, name: e.student?.user?.name || 'Unknown', rating: e.rating }))
      },
      indirectAttainment: { percentage: classAttainmentPct, level, label: levelLabel(level) }
    };
  });
  return Object.keys(result).length > 0 ? result : null;
};

// ─── Final attainment merge ───────────────────────────────────────────────────
const computeFinalAttainment = (cloList, indirectCloAnalysis) => {
  return cloList.map(clo => {
    const directPct = clo.statistics.classAttainment;
    const indirect = indirectCloAnalysis?.[clo.id];
    const indirectPct = indirect?.indirectAttainment?.percentage ?? null;
    const hasIndirect = indirectPct !== null;
    const finalPct = hasIndirect ? 0.8 * directPct + 0.2 * indirectPct : directPct;
    const finalLevel = classAttainmentToLevel(finalPct);
    const directLevel = classAttainmentToLevel(directPct);
    return {
      ...clo,
      directAttainment: { ...clo.directAttainment, level: directLevel, label: levelLabel(directLevel) },
      indirectAttainment: indirect?.indirectAttainment || null,
      finalAttainment: { percentage: finalPct, level: finalLevel, label: levelLabel(finalLevel), hasIndirect }
    };
  });
};

// ─── Rich HOD payload ─────────────────────────────────────────────────────────
const buildHODPayload = (performanceData, cloListWithFinal, indirectCloAnalysis) => {
  const hasIndirect = !!indirectCloAnalysis;
  const overallDirectPct = cloListWithFinal.length
    ? cloListWithFinal.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloListWithFinal.length : 0;
  const overallIndirectPct = hasIndirect
    ? Object.values(indirectCloAnalysis).reduce((s, c) => s + c.statistics.classAttainment, 0) / Object.values(indirectCloAnalysis).length : null;
  const overallFinalPct = hasIndirect ? 0.8 * overallDirectPct + 0.2 * overallIndirectPct : overallDirectPct;

  const cloDetails = cloListWithFinal.map(clo => {
    const indirect = indirectCloAnalysis?.[clo.id];
    const finalLevel = clo.finalAttainment?.level ?? clo.directAttainment.level;
    const finalPct = clo.finalAttainment?.percentage ?? clo.statistics.classAttainment;
    const studentScoresRaw = Array.isArray(clo.studentScores)
      ? clo.studentScores
      : Object.values(clo.studentScores || {});

    return {
      cloId: clo.id, cloCode: clo.code, cloStatement: clo.statement,
      bloomLevel: clo.bloomLevel, threshold: clo.threshold,
      direct: {
        classAttainmentPct: parseFloat(clo.statistics.classAttainment.toFixed(2)),
        attainedStudents: clo.statistics.attainedStudents,
        totalStudents: clo.statistics.totalStudents,
        level: clo.directAttainment.level,
        levelLabel: clo.directAttainment.label,
        averageScore: parseFloat((clo.statistics.averageScore || 0).toFixed(2)),
        studentScores: studentScoresRaw.map(s => ({
          rollNumber: s.rollNumber, name: s.name,
          percentage: parseFloat((s.percentage ?? s.averagePercentage ?? 0).toFixed(2)),
          attained: s.attained ?? s.overallAttained ?? false,
          level: s.attainmentLevel ?? s.overallAttainmentLevel ?? 0
        }))
      },
      indirect: indirect ? {
        classAttainmentPct: parseFloat(indirect.statistics.classAttainment.toFixed(2)),
        attainedStudents: indirect.statistics.attainedStudents,
        totalStudents: indirect.statistics.totalStudents,
        averageRating: parseFloat(indirect.statistics.averageRating.toFixed(2)),
        level: indirect.indirectAttainment.level,
        levelLabel: indirect.indirectAttainment.label,
        ratingDistribution: indirect.statistics.distribution,
        studentRatings: (indirect.statistics.studentRatings || []).map(s => ({
          rollNumber: s.rollNumber, name: s.name, rating: s.rating,
          attained: s.rating >= (clo.threshold / 100) * 5
        }))
      } : null,
      final: {
        attainmentPct: parseFloat(finalPct.toFixed(2)),
        level: finalLevel, levelLabel: levelLabel(finalLevel),
        hasIndirectData: hasIndirect && !!indirect,
        formula: hasIndirect && indirect
          ? `0.8 × ${clo.statistics.classAttainment.toFixed(1)}% + 0.2 × ${indirect.statistics.classAttainment.toFixed(1)}% = ${finalPct.toFixed(1)}%`
          : `${clo.statistics.classAttainment.toFixed(1)}% (direct only)`
      }
    };
  });

  return {
    courseId: performanceData.course.id,
    courseCode: performanceData.course.code,
    courseName: performanceData.course.name,
    semester: performanceData.course.semester,
    year: performanceData.course.year,
    assessmentIds: performanceData.assessments?.map(a => a.id).filter(Boolean) || [],
    generatedAt: new Date().toISOString(),
    courseSummary: {
      totalClos: cloListWithFinal.length,
      totalStudents: performanceData.students?.length || 0,
      overallDirectAttainmentPct: parseFloat(overallDirectPct.toFixed(2)),
      overallIndirectAttainmentPct: overallIndirectPct !== null ? parseFloat(overallIndirectPct.toFixed(2)) : null,
      overallFinalAttainmentPct: parseFloat(overallFinalPct.toFixed(2)),
      overallFinalLevel: classAttainmentToLevel(overallFinalPct),
      overallFinalLevelLabel: levelLabel(classAttainmentToLevel(overallFinalPct)),
      hasIndirectAssessment: hasIndirect,
      attainmentFormula: hasIndirect
        ? '0.8 × Direct Attainment + 0.2 × Indirect Attainment'
        : 'Direct Attainment only (no indirect data)'
    },
    cloDetails
  };
};



// ─── PDF HTML builder ─────────────────────────────────────────────────────────
const buildPDFHTML = (performanceData, cloListWithFinal, indirectCloAnalysis, assignedFaculties) => {
  const cloList = cloListWithFinal.length ? cloListWithFinal : Object.values(performanceData.cloAnalysis);
  const hasIndirect = !!indirectCloAnalysis;
  const { code: courseCode, name: courseName, semester, year } = performanceData.course;
  const lc = ['#dc2626', '#f97316', '#ca8a04', '#16a34a'];
  const overallDirect = cloList.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloList.length;
  const overallIndirect = hasIndirect ? Object.values(indirectCloAnalysis).reduce((s, c) => s + c.statistics.classAttainment, 0) / Object.values(indirectCloAnalysis).length : null;
  const overallFinal = hasIndirect ? 0.8 * overallDirect + 0.2 * overallIndirect : overallDirect;
  const overallFinalLevel = classAttainmentToLevel(overallFinal);

  // Faculty names
  const facultyNames = assignedFaculties.map(f => f.name).join(' · ');
  const coordinator = assignedFaculties.find(f => f.isCoordinator);

  const cloRows = cloList.map(clo => {
    const ind = indirectCloAnalysis?.[clo.id];
    const finalPct = clo.finalAttainment?.percentage ?? clo.statistics.classAttainment;
    const fl = clo.finalAttainment?.level ?? clo.directAttainment.level;
    const indCells = hasIndirect
      ? `<td>${ind ? ind.statistics.averageRating.toFixed(2) + '/5' : '—'}</td><td>${ind ? ind.statistics.classAttainment.toFixed(1) + '%' : '—'}</td><td style="color:${ind ? lc[ind.indirectAttainment.level] : '#94a3b8'};font-weight:600">${ind ? `L${ind.indirectAttainment.level} ${ind.indirectAttainment.label}` : '—'}</td>` : '';
    return `<tr><td><strong>${clo.code}</strong></td><td>${clo.bloomLevel || 'N/A'}</td><td>${clo.threshold}%</td><td>${clo.statistics.attainedStudents}/${clo.statistics.totalStudents}</td><td>${clo.statistics.classAttainment.toFixed(1)}%</td><td style="color:${lc[clo.directAttainment.level]};font-weight:600">L${clo.directAttainment.level} ${clo.directAttainment.label}</td>${indCells}<td><strong>${finalPct.toFixed(1)}%</strong></td><td style="color:${lc[fl]};font-weight:700">L${fl} ${levelLabel(fl)}</td></tr>`;
  }).join('');

  let indirectSection = '';
  if (hasIndirect) {
    const tables = Object.values(indirectCloAnalysis).map(ic => {
      const rows = (ic.statistics.studentRatings || []).slice(0, 60).map(s => {
        const att = s.rating >= (ic.threshold / 100) * 5;
        return `<tr><td>${s.rollNumber}</td><td>${s.name}</td><td>${'★'.repeat(Math.round(s.rating))}${'☆'.repeat(5 - Math.round(s.rating))} ${s.rating}</td><td style="color:${att ? '#16a34a' : '#dc2626'};font-weight:600">${att ? '✓ Attained' : '✗ Not Attained'}</td></tr>`;
      }).join('');
      return `<h4 style="margin:16px 0 4px;font-size:12px;color:#374151">${ic.code} — ${ic.statement?.substring(0, 90) || ''}</h4>
      <p style="font-size:10px;color:#64748b;margin:0 0 8px">Avg: ${ic.statistics.averageRating.toFixed(2)}/5 &nbsp;|&nbsp; Class Attainment: ${ic.statistics.classAttainment.toFixed(1)}% &nbsp;|&nbsp; Level ${ic.indirectAttainment.level} (${ic.indirectAttainment.label}) &nbsp;|&nbsp; ${ic.statistics.attainedStudents}/${ic.statistics.totalStudents} students attained</p>
      <table><thead><tr><th>Roll No</th><th>Student</th><th>Rating</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
    }).join('');
    indirectSection = `<h2>Indirect Assessment — Student Ratings</h2>${tables}`;
  }

  const cloHeaders = cloList.map(c => `<th colspan="2">${c.code}</th>`).join('');
  const cloSubHeaders = cloList.map(() => `<th>Score%</th><th>Lvl</th>`).join('');
  const studentRows = performanceData.students.slice(0, 100).map(s => {
    const cells = cloList.map(clo => {
      const perf = s.cloPerformance[clo.id];
      const pct = perf?.averagePercentage ?? perf?.percentage ?? 0;
      const lvl = perf?.attainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
      return `<td>${pct.toFixed(1)}%</td><td>L${lvl}</td>`;
    }).join('');
    return `<tr><td>${s.rollNumber}</td><td>${s.name}</td>${cells}<td><strong>${s.totalPercentage.toFixed(1)}%</strong></td></tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><title>${courseCode} Course Level Attainment Report</title>
  <style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px}
  h1{font-size:20px;color:#1e40af;margin-bottom:0}
  h2{font-size:16px;color:#1e293b;margin:20px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:5px}
  h3{font-size:14px;color:#334155;margin:15px 0 5px}
  h4{font-size:11px;margin:14px 0 4px}
  .subtitle{font-size:14px;color:#1e40af;margin-top:2px;margin-bottom:5px}
  .meta{font-size:10px;color:#64748b;margin-bottom:5px}
  .faculty-line{font-size:11px;color:#334155;background:#f8fafc;padding:6px 10px;border-radius:4px;margin:8px 0;border-left:4px solid #1e40af}
  .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin:10px 0}
  .sum-item{display:flex;flex-direction:column;gap:2px}
  .sum-lbl{font-size:9px;color:#6b7280;text-transform:uppercase}
  .sum-val{font-size:14px;font-weight:700}
  .formula{background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin:8px 0;font-size:10px;color:#78350f}
  table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10px}
  th{background:#f1f5f9;padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-weight:600}
  td{padding:5px 8px;border:1px solid #e2e8f0}
  tr:nth-child(even){background:#f8fafc}
  .print-only-header{display:block}
  @media print{body{margin:0}.faculty-line{border-left:4px solid #000}}
  </style>
  </head><body>
  <h1>${courseCode} — ${courseName}</h1>
  <h3 class="subtitle">Course Level Attainment Report</h3>
  <div class="meta">Semester: ${semester} &nbsp;|&nbsp; Academic Year: ${year} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
  ${facultyNames ? `<div class="faculty-line"><strong>Faculty:</strong> ${facultyNames} ${coordinator ? ` (Coordinator: ${coordinator.name})` : ''}</div>` : ''}
  <div class="summary-grid">
    <div class="sum-item"><span class="sum-lbl">Overall Direct</span><span class="sum-val">${overallDirect.toFixed(1)}%</span></div>
    ${hasIndirect ? `<div class="sum-item"><span class="sum-lbl">Overall Indirect</span><span class="sum-val">${overallIndirect.toFixed(1)}%</span></div>` : '<div></div>'}
    <div class="sum-item"><span class="sum-lbl">Final Attainment</span><span class="sum-val" style="color:${lc[overallFinalLevel]}">${overallFinal.toFixed(1)}% — L${overallFinalLevel} ${levelLabel(overallFinalLevel)}</span></div>
  </div>
  <div class="formula"><strong>Formula:</strong> ${hasIndirect ? `0.8 × ${overallDirect.toFixed(1)}% (Direct) + 0.2 × ${overallIndirect.toFixed(1)}% (Indirect) = ${overallFinal.toFixed(1)}%` : 'Direct Attainment Only — no indirect data uploaded'}</div>
  <h2>CLO Attainment Summary</h2>
  <table><thead><tr><th>CLO</th><th>Bloom's</th><th>Threshold</th><th>Attained</th><th>Direct %</th><th>Direct Level</th>${hasIndirect ? '<th>Avg Rating</th><th>Indirect %</th><th>Indirect Level</th>' : ''}<th>Final %</th><th>Final Level</th></tr></thead><tbody>${cloRows}</tbody></table>
  ${indirectSection}
  <h2>Student-wise CLO Performance${performanceData.students.length > 100 ? ' (first 100)' : ''}</h2>
  <table><thead><tr><th>Roll No.</th><th>Name</th>${cloHeaders}<th>Overall %</th></tr><tr><th></th><th></th>${cloSubHeaders}<th></th></tr></thead><tbody>${studentRows}</tbody></table>
  </body></html>`;
};

const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, sectionKey, expanded, onToggle, children, badge }) => (
  <>
    <div className="section-header" onClick={() => onToggle(sectionKey)}>
      <h3><Icon size={20} /> {title}{badge && <span className="section-badge">{badge}</span>}</h3>
      {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
    </div>
    {expanded && children}
  </>
);

// ─── CLO performance helpers ──────────────────────────────────────────────────
const analyzeCLOPerformance = (marksData, studentsData, closData, courseInfo) => {
  if (!marksData || !studentsData) return null;
  const marksStudents = marksData.students || [];
  const assessmentClos = marksData.clos || [];
  const studentMap = {};
  studentsData.forEach(s => { studentMap[s.id] = s; });
  const cloMap = {};
  closData.forEach(c => { cloMap[c.id] = { threshold: c.attainmentThreshold || 50, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel }; });
  const cloAnalysis = {};
  const studentCLOPerformance = {};
  marksStudents.forEach(ms => {
    const sid = ms.studentId;
    if (!studentCLOPerformance[sid]) studentCLOPerformance[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', cloPerformance: {}, totalObtained: 0, totalMax: 0 };
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
      if (studentCLOPerformance[sid]) { studentCLOPerformance[sid].cloPerformance[cloId] = { obtained, maxMarks, percentage, threshold, attained, attainmentLevel, code: cloCode, statement: cloMap[cloId]?.statement || '' }; studentCLOPerformance[sid].totalObtained += obtained; studentCLOPerformance[sid].totalMax += maxMarks; }
      cloStudentScores.push({ studentId: sid, rollNumber: ms.rollNumber || 'N/A', name: ms.name || 'Unknown', obtained, maxMarks, percentage, attained, attainmentLevel });
    });
    const attainedStudents = cloStudentScores.filter(s => s.attained).length;
    const totalStudents = cloStudentScores.length;
    const classAttainment = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
    cloAnalysis[cloId] = { id: cloId, code: cloCode, statement: cloMap[cloId]?.statement || clo.statement || '', bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '', maxMarks, threshold, studentScores: cloStudentScores, statistics: { totalStudents, attainedStudents, classAttainment, averageScore: totalStudents > 0 ? cloStudentScores.reduce((s, x) => s + x.percentage, 0) / totalStudents : 0, maxScore: totalStudents > 0 ? Math.max(...cloStudentScores.map(s => s.percentage)) : 0, minScore: totalStudents > 0 ? Math.min(...cloStudentScores.map(s => s.percentage)) : 0, attainmentDistribution: { level0: cloStudentScores.filter(s => s.attainmentLevel === 0).length, level1: cloStudentScores.filter(s => s.attainmentLevel === 1).length, level2: cloStudentScores.filter(s => s.attainmentLevel === 2).length, level3: cloStudentScores.filter(s => s.attainmentLevel === 3).length } }, directAttainment: { percentage: classAttainment, level: classAttainmentToLevel(classAttainment), label: levelLabel(classAttainmentToLevel(classAttainment)) } };
  });
  const students = Object.values(studentCLOPerformance).map(s => ({ ...s, totalPercentage: s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0 }));
  return { assessment: { id: marksData.assessment?.id || marksData.id, title: marksData.assessment?.title || marksData.title || 'Assessment', type: marksData.assessment?.type || marksData.type, maxMarks: marksData.assessment?.maxMarks || marksData.maxMarks, duration: marksData.assessment?.duration || marksData.duration, conductedOn: marksData.assessment?.conductedOn || marksData.conductedOn }, course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year }, clos: assessmentClos.map(c => ({ id: c.id, code: cloMap[c.id]?.code || c.code || `CLO-${c.id.slice(0, 4)}`, statement: cloMap[c.id]?.statement || c.statement || '', bloomLevel: cloMap[c.id]?.bloomLevel || c.bloomLevel || '', maxMarks: c.marksAllocated || 0, threshold: cloMap[c.id]?.threshold || 50 })), cloAnalysis, students, generatedAt: new Date().toISOString() };
};

const combineCLOPerformance = (assessmentsData, studentsData, closData, courseInfo, finalizedAssessments) => {
  if (!assessmentsData || assessmentsData.length === 0) return null;
  const studentMap = {};
  studentsData.forEach(s => { studentMap[s.id] = s; });
  const cloMap = {};
  closData.forEach(c => { cloMap[c.id] = { threshold: c.attainmentThreshold || 50, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel }; });
  const allAssessments = finalizedAssessments.map((fa, idx) => { const m = assessmentsData[idx]; return { id: fa.id, title: fa.title || m?.assessment?.title || m?.title || 'Assessment', type: fa.type || m?.assessment?.type || m?.type, maxMarks: fa.maxMarks || m?.assessment?.maxMarks || m?.maxMarks }; });
  const combinedCloAnalysis = {};
  const studentCombinedPerformance = {};
  const assessmentWiseStats = [];
  assessmentsData.forEach((assessmentData, idx) => {
    const marksStudents = assessmentData.students || [];
    const assessmentClos = assessmentData.clos || [];
    const realAssessmentId = finalizedAssessments[idx]?.id || assessmentData.assessment?.id || assessmentData.id;
    const assessmentTitle = finalizedAssessments[idx]?.title || assessmentData.assessment?.title || assessmentData.title;
    const studentScores = marksStudents.map(s => { let tot = 0, mx = 0; Object.values(s.marksByClo || {}).forEach(m => { tot += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; }); return mx > 0 ? (tot / mx) * 100 : 0; });
    assessmentWiseStats.push({ assessment: { id: realAssessmentId, title: assessmentTitle, type: finalizedAssessments[idx]?.type || assessmentData.assessment?.type || assessmentData.type, maxMarks: finalizedAssessments[idx]?.maxMarks || assessmentData.assessment?.maxMarks || assessmentData.maxMarks }, classAverage: studentScores.length > 0 ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length : 0, totalStudents: marksStudents.length, clos: assessmentClos.map(c => ({ id: c.id, code: cloMap[c.id]?.code || c.code, maxMarks: c.marksAllocated })) });
    assessmentClos.forEach(clo => {
      const cloId = clo.id; const maxMarks = clo.marksAllocated || 0; const threshold = cloMap[cloId]?.threshold || 50; const cloCode = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0, 4)}`;
      if (!combinedCloAnalysis[cloId]) combinedCloAnalysis[cloId] = { id: cloId, code: cloCode, statement: cloMap[cloId]?.statement || clo.statement || '', bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '', threshold, assessments: [], studentScores: {}, totalOccurrences: 0 };
      combinedCloAnalysis[cloId].assessments.push({ id: realAssessmentId, title: assessmentTitle, maxMarks });
      marksStudents.forEach(ms => {
        const sid = ms.studentId; const mData = (ms.marksByClo || {})[cloId]; const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0; const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0; const attained = percentage >= threshold; const attainmentLevel = calculateAttainmentLevel(percentage, threshold);
        if (!combinedCloAnalysis[cloId].studentScores[sid]) combinedCloAnalysis[cloId].studentScores[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', scores: [], percentages: [], attainedCount: 0, totalObtained: 0, totalMax: 0 };
        const scd = combinedCloAnalysis[cloId].studentScores[sid]; scd.scores.push({ assessmentId: realAssessmentId, assessmentTitle, obtained, maxMarks, percentage, attained, attainmentLevel }); scd.percentages.push(percentage); scd.totalObtained += obtained; scd.totalMax += maxMarks; if (attained) scd.attainedCount += 1;
      });
      combinedCloAnalysis[cloId].totalOccurrences += 1;
    });
    marksStudents.forEach(ms => {
      const sid = ms.studentId;
      if (!studentCombinedPerformance[sid]) studentCombinedPerformance[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', cloPerformance: {}, totalObtained: 0, totalMax: 0, assessmentsAttempted: 0, assessmentScores: [] };
      let tot = 0, mx = 0; Object.values(ms.marksByClo || {}).forEach(m => { tot += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; });
      studentCombinedPerformance[sid].assessmentScores.push({ assessmentId: realAssessmentId, assessmentTitle, totalPercentage: mx > 0 ? (tot / mx) * 100 : 0, obtained: tot, maxMarks: mx }); studentCombinedPerformance[sid].assessmentsAttempted += 1;
    });
  });
  Object.keys(combinedCloAnalysis).forEach(cloId => {
    const clo = combinedCloAnalysis[cloId]; const arr = Object.values(clo.studentScores); const totalStudents = arr.length;
    arr.forEach(s => { s.averagePercentage = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0; s.overallAttained = s.attainedCount >= Math.ceil(clo.totalOccurrences * 0.7); s.overallAttainmentLevel = calculateAttainmentLevel(s.averagePercentage, clo.threshold); });
    const attainedStudents = arr.filter(s => s.overallAttained).length; const classAttainment = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
    clo.statistics = { totalStudents, attainedStudents, classAttainment, averageScore: totalStudents > 0 ? arr.reduce((s, x) => s + x.averagePercentage, 0) / totalStudents : 0, attainmentDistribution: { level0: arr.filter(s => s.overallAttainmentLevel === 0).length, level1: arr.filter(s => s.overallAttainmentLevel === 1).length, level2: arr.filter(s => s.overallAttainmentLevel === 2).length, level3: arr.filter(s => s.overallAttainmentLevel === 3).length } };
    clo.directAttainment = { percentage: classAttainment, level: classAttainmentToLevel(classAttainment), label: levelLabel(classAttainmentToLevel(classAttainment)) };
    arr.forEach(s => { if (studentCombinedPerformance[s.studentId]) { studentCombinedPerformance[s.studentId].cloPerformance[cloId] = { code: clo.code, averagePercentage: s.averagePercentage, overallAttained: s.overallAttained, attainmentLevel: s.overallAttainmentLevel, assessmentsCount: clo.totalOccurrences, attainedCount: s.attainedCount, percentages: s.percentages, scores: s.scores }; studentCombinedPerformance[s.studentId].totalObtained += s.totalObtained; studentCombinedPerformance[s.studentId].totalMax += s.totalMax; } });
  });
  const students = Object.values(studentCombinedPerformance).map(s => { const totalPercentage = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0; const closAttained = Object.values(s.cloPerformance).filter(c => c.overallAttained).length; const totalClos = Object.keys(s.cloPerformance).length; return { ...s, totalPercentage, closAttained, totalClos, overallAttained: closAttained >= Math.ceil(totalClos * 0.7) }; });
  return { assessments: allAssessments, assessmentWiseStats, course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year }, clos: Object.values(combinedCloAnalysis).map(c => ({ id: c.id, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel, threshold: c.threshold })), cloAnalysis: combinedCloAnalysis, students, generatedAt: new Date().toISOString() };
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentPerformanceAnalysis = ({ course, assessmentId = null, onClose, standalone = true, showHeader = true, className = '' }) => {
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [analysisMode, setAnalysisMode] = useState('all');
  const [isReportSubmitted, setIsReportSubmitted] = useState(false);
  const [assignedFaculties, setAssignedFaculties] = useState([]);
  const analysisModeRef = useRef('all');
  const finalizedAssessmentsRef = useRef([]);
  const [indirectData, setIndirectData] = useState(null);
  const [indirectCloAnalysis, setIndirectCloAnalysis] = useState(null);
  const [indirectLoading, setIndirectLoading] = useState(false);
  const [closData, setClosData] = useState([]);
  const [cloListWithFinal, setCloListWithFinal] = useState([]);
  const [expandedSections, setExpandedSections] = useState({ assessmentDetails: true, quickGlance: true, cloWiseAnalysis: true, attainmentSummary: true, studentPerformance: true, indirectAssessment: true });

  const setMode = m => { analysisModeRef.current = m; setAnalysisMode(m); };
  const toggleSection = k => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

  const loadIndirectData = useCallback(async (sem, yr) => {
    if (!course?.id) return;
    setIndirectLoading(true);
    try {
      const res = await facultyApi.getIndirectAssessments(course.id, { semester: sem || course.semester, year: yr || course.year });
      const unwrapped = getResponseData(res);
      const rawArray = (Array.isArray(unwrapped?.rawData) && unwrapped.rawData) || (Array.isArray(unwrapped?.data?.rawData) && unwrapped.data.rawData) || (Array.isArray(unwrapped) && unwrapped) || null;
      setIndirectData(rawArray?.length > 0 ? rawArray : null);
    } catch { setIndirectData(null); }
    finally { setIndirectLoading(false); }
  }, [course]);

  useEffect(() => {
    if (!performanceData) { setCloListWithFinal([]); return; }
    setCloListWithFinal(computeFinalAttainment(Object.values(performanceData.cloAnalysis), indirectCloAnalysis));
  }, [performanceData, indirectCloAnalysis]);

  useEffect(() => {
    if (Array.isArray(indirectData) && indirectData.length > 0 && closData.length > 0) setIndirectCloAnalysis(analyzeIndirectAssessment(indirectData, closData));
    else setIndirectCloAnalysis(null);
  }, [indirectData, closData]);

  const checkReportSubmissionStatus = useCallback(async () => {
    if (!performanceData || analysisModeRef.current !== 'all') return;
    try {
      const assessmentIds = performanceData.assessments?.map(a => a.id) || [];
      const params = new URLSearchParams({ courseId: performanceData.course.id, semester: performanceData.course.semester, year: performanceData.course.year });
      if (assessmentIds.length > 0) params.append('assessmentIds', assessmentIds.join(','));
      const response = await facultyApi.checkReportSubmission(params);
      setIsReportSubmitted(response.data.isSubmitted);
    } catch { setIsReportSubmitted(false); }
  }, [performanceData]);

  const fetchAssessmentMarks = useCallback(async (asmtId, studentsData, clos) => {
    const marksData = getResponseData(await assessmentApi.getAssessmentMarks(asmtId));
    if (!marksData) throw new Error('No marks data received');
    return analyzeCLOPerformance(marksData, studentsData, clos, course);
  }, [course]);

  const fetchAllAssessmentsPerformance = useCallback(async (finalized, studentsData, clos) => {
    const results = await Promise.all(finalized.map(a => assessmentApi.getAssessmentMarks(a.id).then(r => getResponseData(r)).catch(() => null)));
    const valid = results.filter(d => d && d.students);
    const validFinalized = finalized.filter((_, i) => results[i] && results[i].students);
    if (valid.length === 0) throw new Error('No valid marks data found for any assessment');
    return combineCLOPerformance(valid, studentsData, clos, course, validFinalized);
  }, [course]);

  const fetchAllData = useCallback(async () => {
    if (!course) { setError('Please select a course'); return; }
    try {
      setLoading(true); setError(null); setIsReportSubmitted(false);
      
      // Fetch course assessments, students, CLOs, and faculty assignments in parallel
      const [assessmentsRes, studentsRes, closRes, facultyRes] = await Promise.all([
        assessmentApi.getCourseAssessments(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseClos(course.id),
        fetchAssignedFaculties(course.id, course.semester, course.year)
      ]);
      
      const assessmentsData = getResponseData(assessmentsRes)?.assessments || [];
      const studentsData = getResponseData(studentsRes)?.students || [];
      const clos = getResponseData(closRes) || [];
      
      setClosData(clos);
      setAssignedFaculties(facultyRes);
      
      const finalized = assessmentsData.filter(a => a.isMarksFinalized === true);
      setAvailableAssessments(finalized);
      finalizedAssessmentsRef.current = finalized;
      
      if (finalized.length === 0) { setError('No finalized assessments found'); return; }
      
      if (assessmentId) {
        const target = finalized.find(a => a.id === assessmentId);
        if (target) { setSelectedAssessment(target); setMode('single'); setPerformanceData(await fetchAssessmentMarks(target.id, studentsData, clos)); }
        else setError('Assessment not found or not finalized');
      } else {
        setMode('all');
        setPerformanceData(await fetchAllAssessmentsPerformance(finalized, studentsData, clos));
        await loadIndirectData(course.semester, course.year);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [course, assessmentId, fetchAssessmentMarks, fetchAllAssessmentsPerformance, loadIndirectData]);

  useEffect(() => { if (course) fetchAllData(); }, [course, assessmentId, fetchAllData]);
  useEffect(() => { if (performanceData && analysisMode === 'all') checkReportSubmissionStatus(); }, [performanceData, analysisMode, checkReportSubmissionStatus]);

  const handleAssessmentSelect = async (value) => {
    setIsReportSubmitted(false); setError(null); setPerformanceData(null); setLoading(true);
    try {
      const [studentsRes, closRes] = await Promise.all([assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }), assessmentApi.getCourseClos(course.id)]);
      const studentsData = getResponseData(studentsRes)?.students || [];
      const clos = getResponseData(closRes) || [];
      setClosData(clos);
      if (value === 'all') { setMode('all'); setPerformanceData(await fetchAllAssessmentsPerformance(finalizedAssessmentsRef.current, studentsData, clos)); await loadIndirectData(course.semester, course.year); }
      else { const target = availableAssessments.find(a => a.id === value); if (target) { setSelectedAssessment(target); setMode('single'); setIndirectData(null); setIndirectCloAnalysis(null); setPerformanceData(await fetchAssessmentMarks(target.id, studentsData, clos)); } }
    } catch { setError('Failed to load assessment data'); }
    finally { setLoading(false); }
  };

  const handleSubmitToHOD = async () => {
    if (!performanceData || analysisModeRef.current !== 'all') return;
    try {
      setSubmitting(true); setError(null); setSuccessMessage('');
      await facultyApi.submitReportToHOD({
        reportName: `${performanceData.course.code} - CLO Attainment Report (Sem ${performanceData.course.semester} ${performanceData.course.year})`,
        reportType: "COMBINED",
        academicYear: `${performanceData.course.year}-${(performanceData.course.year + 1).toString().slice(-2)}`,
        reportParameters: buildHODPayload(performanceData, cloListWithFinal, indirectCloAnalysis)
      });
      setIsReportSubmitted(true);
      setSuccessMessage('Report submitted to HOD successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit report to HOD'); }
    finally { setSubmitting(false); }
  };


  const handleExportPDF = () => {
    if (!performanceData) return;
    const html = buildPDFHTML(performanceData, cloListWithFinal, indirectCloAnalysis, assignedFaculties);
    const win = window.open('', '_blank', 'width=1000,height=750');
    if (!win) { alert('Please allow popups for PDF export'); return; }
    win.document.write(html); win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  if (loading) return <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}><div className="loading-state"><div className="spinner" /><p>Loading CLO performance data…</p></div></div>;
  if (error && !performanceData) return <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}><div className="error-state"><AlertTriangle size={48} /><h3>Analysis Unavailable</h3><p>{error}</p>{onClose && <button className="btn btn-outline" onClick={onClose}>Close</button>}</div></div>;
  if (!performanceData) return <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}><div className="empty-state"><Target size={64} /><h3>No CLO Performance Data Available</h3><p>No finalized assessments found for this course.</p></div></div>;

  const isAllMode = analysisMode === 'all';
  const activeCloList = cloListWithFinal.length ? cloListWithFinal : Object.values(performanceData.cloAnalysis);

  return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      {showHeader && (
        <PerformanceHeader 
          isAllMode={isAllMode} 
          performanceData={performanceData} 
          availableAssessments={availableAssessments} 
          selectedAssessment={selectedAssessment} 
          submitting={submitting} 
          isReportSubmitted={isReportSubmitted} 
          hasIndirectData={!!indirectCloAnalysis} 
          onAssessmentSelect={handleAssessmentSelect} 
          onSubmitToHOD={handleSubmitToHOD} 
          onExportPDF={handleExportPDF} 
          onClose={onClose} 
          assignedFaculties={assignedFaculties}
        />
      )}

      {!showHeader && isAllMode && (
        <div className="actions-bar-no-header">
          <button className={`btn-submit-hod ${isReportSubmitted ? 'btn-submitted' : ''}`} onClick={handleSubmitToHOD} disabled={submitting || isReportSubmitted}>
            <span>{submitting ? 'Submitting...' : isReportSubmitted ? 'Already Submitted' : 'Submit to HOD'}</span>
            {isReportSubmitted && <CheckCircle size={16} className="submitted-check" />}
          </button>
          <button className="btn-export btn-export-pdf" onClick={handleExportPDF}><span>Export PDF</span></button>
        </div>
      )}

      {successMessage && <div className="success-message"><CheckCircle size={20} /><span>{successMessage}</span></div>}
      {error && performanceData && <div className="error-inline"><AlertTriangle size={20} /><span>{error}</span></div>}

      <div className="analysis-content">
        <div className="assessment-info-banner">
          <div className="info-item"><BookOpen size={18} /><span className="label">Course:</span><span className="value">{performanceData.course.code} — {performanceData.course.name}</span></div>
          <div className="info-item"><Users size={18} /><span className="label">Students:</span><span className="value">{performanceData.students.length}</span></div>
          <div className="info-item"><Layers size={18} /><span className="label">CLOs:</span><span className="value">{activeCloList.length}</span></div>
          {!isAllMode && performanceData.assessment && (<><div className="info-item"><Star size={18} /><span className="label">Max Marks:</span><span className="value">{performanceData.assessment.maxMarks}</span></div>{performanceData.assessment.duration && <div className="info-item"><Clock size={18} /><span className="label">Duration:</span><span className="value">{performanceData.assessment.duration} mins</span></div>}</>)}
          {isAllMode && (<>
            <div className="info-item"><FileText size={18} /><span className="label">Assessments:</span><span className="value">{performanceData.assessments?.length || 0}</span></div>
            <div className="info-item"><Upload size={18} /><span className="label">Indirect:</span><span className={`value ${indirectCloAnalysis ? 'text-success' : 'text-muted'}`}>{indirectLoading ? 'Loading…' : indirectCloAnalysis ? '✓ Loaded' : 'Not uploaded'}</span></div>
            {assignedFaculties.length > 0 && (
              <div className="info-item faculty-info">
                <UsersIcon size={18} />
                <span className="label">Faculty:</span>
                <span className="value faculty-names" title={assignedFaculties.map(f => f.email).join(', ')}>
                  {assignedFaculties.map(f => f.name).join(', ')}
                </span>
              </div>
            )}
          </>)}
        </div>

        <Section title="Assessment Details" icon={FileText} sectionKey="assessmentDetails" expanded={expandedSections.assessmentDetails} onToggle={toggleSection}>
          <div className="assessment-details-section"><AssessmentDetails isAllMode={isAllMode} performanceData={performanceData} /></div>
        </Section>

        {isAllMode && (
          <Section
            title="Indirect Assessment"
            icon={Upload}
            sectionKey="indirectAssessment"
            expanded={expandedSections.indirectAssessment}
            onToggle={toggleSection}
            badge={indirectCloAnalysis ? `✓ ${Object.keys(indirectCloAnalysis).length} CLOs analysed` : 'Pending upload'}
          >
            <IndirectAssessmentPanel
              indirectData={indirectData}
              indirectCloAnalysis={indirectCloAnalysis}
              cloListWithFinal={cloListWithFinal}
              closData={closData}
              course={course}
              semester={performanceData.course.semester}
              year={performanceData.course.year}
              indirectLoading={indirectLoading}
              facultyApi={facultyApi}
              onUploaded={() => loadIndirectData(performanceData.course.semester, performanceData.course.year)}
            />
          </Section>
        )}

        <Section title="Quick Glance: CLO Attainment Dashboard" icon={BarChart} sectionKey="quickGlance" expanded={expandedSections.quickGlance} onToggle={toggleSection}>
          <QuickGlanceDashboard cloList={activeCloList} />
        </Section>

        <Section title="CLO-wise Attainment Analysis" icon={Target} sectionKey="cloWiseAnalysis" expanded={expandedSections.cloWiseAnalysis} onToggle={toggleSection}>
          <CLOAnalysisSection cloList={activeCloList} calculateAttainmentLevel={calculateAttainmentLevel} />
        </Section>


        <Section title="Student-wise CLO Performance" icon={Users} sectionKey="studentPerformance" expanded={expandedSections.studentPerformance} onToggle={toggleSection}>
          <StudentPerformanceTable performanceData={performanceData} cloList={activeCloList} isAllMode={isAllMode} calculateAttainmentLevel={calculateAttainmentLevel} />
        </Section>

        
        <Section title="CLO Attainment Summary" icon={Award} sectionKey="attainmentSummary" expanded={expandedSections.attainmentSummary} onToggle={toggleSection}>
          <AttainmentSummary cloList={activeCloList} hasIndirectData={!!indirectCloAnalysis} isSingleAssessment={!isAllMode} />
        </Section>
      </div>
    </div>
  );
};

export default StudentPerformanceAnalysis;