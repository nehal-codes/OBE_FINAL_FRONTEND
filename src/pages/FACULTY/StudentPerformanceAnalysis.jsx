// // src/components/faculty/StudentPerformanceAnalysis.jsx
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   BarChart, Users, Award, AlertTriangle, CheckCircle,
//   Target, ChevronDown, ChevronRight, FileText, Layers,
//   BookOpen, Clock, Star, Upload, Users as UsersIcon
// } from 'lucide-react';
// import assessmentApi from "../../apis/assessments/assessment";
// import facultyApi from "../../apis/faculty";
// import HODAPI from '../../apis/HOD';
// import PerformanceHeader from './Performance/PerformanceHeader';
// import AssessmentDetails from './Performance/AssessmentDetails';
// import CLOAnalysisSection from './Performance/CLOAnalysisSection';
// import QuickGlanceDashboard from './Performance/QuickGlanceDashboard';
// import StudentPerformanceTable from './Performance/StudentPerformanceTable';
// import AttainmentSummary from './Performance/AttainmentSummary';
// import IndirectAssessmentPanel from './Performance/IndirectAssessmentPanel';
// import './Performance/IndirectAssessmentPanel.css';

// const getResponseData = (response) => {
//   if (response?.data?.data) return response.data.data;
//   if (response?.data) return response.data;
//   return response;
// };

// export const calculateAttainmentLevel = (percentage, threshold) => {
//   if (percentage < threshold) return 0;
//   if (percentage < threshold + 10) return 1;
//   if (percentage < threshold + 20) return 2;
//   return 3;
// };

// const classAttainmentToLevel = (pct) => {
//   if (pct >= 60) return 3;
//   if (pct >= 50) return 2;
//   if (pct >= 40) return 1;
//   return 0;
// };

// const levelLabel = (l) => ['Not Attained', 'Low', 'Medium', 'High'][l] ?? 'N/A';

// // ─── Faculty data fetching ───────────────────────────────────────────────────
// const fetchAssignedFaculties = async (courseId, semester, year) => {
//   try {
//     const facRes = await HODAPI.assignments.getCourseAssignments(
//       courseId,
//       String(semester),
//       String(year)
//     );
    
//     let assignmentsData = [];
//     if (Array.isArray(facRes.data)) {
//       assignmentsData = facRes.data;
//     } else if (facRes.data?.assignments && Array.isArray(facRes.data.assignments)) {
//       assignmentsData = facRes.data.assignments;
//     } else if (facRes.data?.data?.assignments && Array.isArray(facRes.data.data.assignments)) {
//       assignmentsData = facRes.data.data.assignments;
//     }
    
//     return assignmentsData.map(f => ({
//       name: f.faculty?.name || f.facultyName || 'Unknown',
//       email: f.faculty?.user?.email || '',
//       isCoordinator: f.isCourseCoordinator || false
//     }));
//   } catch (err) {
//     if (err.response?.status === 404) {
//       return []; // No faculty assigned
//     }
//     console.error('Error fetching assignments:', err);
//     return [];
//   }
// };

// // ─── Indirect analysis ────────────────────────────────────────────────────────
// const analyzeIndirectAssessment = (rawData, closData) => {
//   if (!Array.isArray(rawData) || !rawData.length) return null;
//   const cloMap = {};
//   closData.forEach(c => { cloMap[c.id] = c; });
//   const byClo = {};
//   rawData.forEach(entry => {
//     if (!byClo[entry.cloId]) byClo[entry.cloId] = [];
//     byClo[entry.cloId].push(entry);
//   });
//   const result = {};
//   Object.entries(byClo).forEach(([cloId, entries]) => {
//     const cloInfo = entries[0].clo;
//     const clo = cloMap[cloId] || {};
//     const threshold = clo.attainmentThreshold || cloInfo?.attainmentThreshold || 50;
//     const attainThresholdRating = (threshold / 100) * 5;
//     const totalStudents = entries.length;
//     const attainedStudents = entries.filter(e => e.rating >= attainThresholdRating).length;
//     const classAttainmentPct = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
//     const level = classAttainmentToLevel(classAttainmentPct);
//     const averageRating = totalStudents > 0 ? entries.reduce((s, e) => s + e.rating, 0) / totalStudents : 0;
//     const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
//     entries.forEach(e => { const r = Math.round(e.rating); if (r >= 1 && r <= 5) distribution[r]++; });
//     result[cloId] = {
//       id: cloId, code: cloInfo?.code || '', statement: cloInfo?.statement || '',
//       bloomLevel: cloInfo?.bloomLevel || '', threshold,
//       statistics: {
//         totalStudents, attainedStudents, classAttainment: classAttainmentPct,
//         averageRating, distribution,
//         studentRatings: entries.map(e => ({ studentId: e.student?.id, rollNumber: e.student?.rollNumber, name: e.student?.user?.name || 'Unknown', rating: e.rating }))
//       },
//       indirectAttainment: { percentage: classAttainmentPct, level, label: levelLabel(level) }
//     };
//   });
//   return Object.keys(result).length > 0 ? result : null;
// };

// // ─── Final attainment merge ───────────────────────────────────────────────────
// const computeFinalAttainment = (cloList, indirectCloAnalysis) => {
//   return cloList.map(clo => {
//     const directPct = clo.statistics.classAttainment;
//     const indirect = indirectCloAnalysis?.[clo.id];
//     const indirectPct = indirect?.indirectAttainment?.percentage ?? null;
//     const hasIndirect = indirectPct !== null;
//     const finalPct = hasIndirect ? 0.8 * directPct + 0.2 * indirectPct : directPct;
//     const finalLevel = classAttainmentToLevel(finalPct);
//     const directLevel = classAttainmentToLevel(directPct);
//     return {
//       ...clo,
//       directAttainment: { ...clo.directAttainment, level: directLevel, label: levelLabel(directLevel) },
//       indirectAttainment: indirect?.indirectAttainment || null,
//       finalAttainment: { percentage: finalPct, level: finalLevel, label: levelLabel(finalLevel), hasIndirect }
//     };
//   });
// };

// // ─── Rich HOD payload ─────────────────────────────────────────────────────────
// const buildHODPayload = (performanceData, cloListWithFinal, indirectCloAnalysis) => {
//   const hasIndirect = !!indirectCloAnalysis;
//   const overallDirectPct = cloListWithFinal.length
//     ? cloListWithFinal.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloListWithFinal.length : 0;
//   const overallIndirectPct = hasIndirect
//     ? Object.values(indirectCloAnalysis).reduce((s, c) => s + c.statistics.classAttainment, 0) / Object.values(indirectCloAnalysis).length : null;
//   const overallFinalPct = hasIndirect ? 0.8 * overallDirectPct + 0.2 * overallIndirectPct : overallDirectPct;

//   const cloDetails = cloListWithFinal.map(clo => {
//     const indirect = indirectCloAnalysis?.[clo.id];
//     const finalLevel = clo.finalAttainment?.level ?? clo.directAttainment.level;
//     const finalPct = clo.finalAttainment?.percentage ?? clo.statistics.classAttainment;
//     const studentScoresRaw = Array.isArray(clo.studentScores)
//       ? clo.studentScores
//       : Object.values(clo.studentScores || {});

//     return {
//       cloId: clo.id, cloCode: clo.code, cloStatement: clo.statement,
//       bloomLevel: clo.bloomLevel, threshold: clo.threshold,
//       direct: {
//         classAttainmentPct: parseFloat(clo.statistics.classAttainment.toFixed(2)),
//         attainedStudents: clo.statistics.attainedStudents,
//         totalStudents: clo.statistics.totalStudents,
//         level: clo.directAttainment.level,
//         levelLabel: clo.directAttainment.label,
//         averageScore: parseFloat((clo.statistics.averageScore || 0).toFixed(2)),
//         studentScores: studentScoresRaw.map(s => ({
//           rollNumber: s.rollNumber, name: s.name,
//           percentage: parseFloat((s.percentage ?? s.averagePercentage ?? 0).toFixed(2)),
//           attained: s.attained ?? s.overallAttained ?? false,
//           level: s.attainmentLevel ?? s.overallAttainmentLevel ?? 0
//         }))
//       },
//       indirect: indirect ? {
//         classAttainmentPct: parseFloat(indirect.statistics.classAttainment.toFixed(2)),
//         attainedStudents: indirect.statistics.attainedStudents,
//         totalStudents: indirect.statistics.totalStudents,
//         averageRating: parseFloat(indirect.statistics.averageRating.toFixed(2)),
//         level: indirect.indirectAttainment.level,
//         levelLabel: indirect.indirectAttainment.label,
//         ratingDistribution: indirect.statistics.distribution,
//         studentRatings: (indirect.statistics.studentRatings || []).map(s => ({
//           rollNumber: s.rollNumber, name: s.name, rating: s.rating,
//           attained: s.rating >= (clo.threshold / 100) * 5
//         }))
//       } : null,
//       final: {
//         attainmentPct: parseFloat(finalPct.toFixed(2)),
//         level: finalLevel, levelLabel: levelLabel(finalLevel),
//         hasIndirectData: hasIndirect && !!indirect,
//         formula: hasIndirect && indirect
//           ? `0.8 × ${clo.statistics.classAttainment.toFixed(1)}% + 0.2 × ${indirect.statistics.classAttainment.toFixed(1)}% = ${finalPct.toFixed(1)}%`
//           : `${clo.statistics.classAttainment.toFixed(1)}% (direct only)`
//       }
//     };
//   });

//   return {
//     courseId: performanceData.course.id,
//     courseCode: performanceData.course.code,
//     courseName: performanceData.course.name,
//     semester: performanceData.course.semester,
//     year: performanceData.course.year,
//     assessmentIds: performanceData.assessments?.map(a => a.id).filter(Boolean) || [],
//     generatedAt: new Date().toISOString(),
//     courseSummary: {
//       totalClos: cloListWithFinal.length,
//       totalStudents: performanceData.students?.length || 0,
//       overallDirectAttainmentPct: parseFloat(overallDirectPct.toFixed(2)),
//       overallIndirectAttainmentPct: overallIndirectPct !== null ? parseFloat(overallIndirectPct.toFixed(2)) : null,
//       overallFinalAttainmentPct: parseFloat(overallFinalPct.toFixed(2)),
//       overallFinalLevel: classAttainmentToLevel(overallFinalPct),
//       overallFinalLevelLabel: levelLabel(classAttainmentToLevel(overallFinalPct)),
//       hasIndirectAssessment: hasIndirect,
//       attainmentFormula: hasIndirect
//         ? '0.8 × Direct Attainment + 0.2 × Indirect Attainment'
//         : 'Direct Attainment only (no indirect data)'
//     },
//     cloDetails
//   };
// };



// // ─── PDF HTML builder ─────────────────────────────────────────────────────────
// const buildPDFHTML = (performanceData, cloListWithFinal, indirectCloAnalysis, assignedFaculties) => {
//   const cloList = cloListWithFinal.length ? cloListWithFinal : Object.values(performanceData.cloAnalysis);
//   const hasIndirect = !!indirectCloAnalysis;
//   const { code: courseCode, name: courseName, semester, year } = performanceData.course;
//   const lc = ['#dc2626', '#f97316', '#ca8a04', '#16a34a'];
//   const overallDirect = cloList.reduce((s, c) => s + c.statistics.classAttainment, 0) / cloList.length;
//   const overallIndirect = hasIndirect ? Object.values(indirectCloAnalysis).reduce((s, c) => s + c.statistics.classAttainment, 0) / Object.values(indirectCloAnalysis).length : null;
//   const overallFinal = hasIndirect ? 0.8 * overallDirect + 0.2 * overallIndirect : overallDirect;
//   const overallFinalLevel = classAttainmentToLevel(overallFinal);

//   // Faculty names
//   const facultyNames = assignedFaculties.map(f => f.name).join(' · ');
//   const coordinator = assignedFaculties.find(f => f.isCoordinator);

//   const cloRows = cloList.map(clo => {
//     const ind = indirectCloAnalysis?.[clo.id];
//     const finalPct = clo.finalAttainment?.percentage ?? clo.statistics.classAttainment;
//     const fl = clo.finalAttainment?.level ?? clo.directAttainment.level;
//     const indCells = hasIndirect
//       ? `<td>${ind ? ind.statistics.averageRating.toFixed(2) + '/5' : '—'}</td><td>${ind ? ind.statistics.classAttainment.toFixed(1) + '%' : '—'}</td><td style="color:${ind ? lc[ind.indirectAttainment.level] : '#94a3b8'};font-weight:600">${ind ? `L${ind.indirectAttainment.level} ${ind.indirectAttainment.label}` : '—'}</td>` : '';
//     return `<tr><td><strong>${clo.code}</strong></td><td>${clo.bloomLevel || 'N/A'}</td><td>${clo.threshold}%</td><td>${clo.statistics.attainedStudents}/${clo.statistics.totalStudents}</td><td>${clo.statistics.classAttainment.toFixed(1)}%</td><td style="color:${lc[clo.directAttainment.level]};font-weight:600">L${clo.directAttainment.level} ${clo.directAttainment.label}</td>${indCells}<td><strong>${finalPct.toFixed(1)}%</strong></td><td style="color:${lc[fl]};font-weight:700">L${fl} ${levelLabel(fl)}</td></tr>`;
//   }).join('');

//   let indirectSection = '';
//   if (hasIndirect) {
//     const tables = Object.values(indirectCloAnalysis).map(ic => {
//       const rows = (ic.statistics.studentRatings || []).slice(0, 60).map(s => {
//         const att = s.rating >= (ic.threshold / 100) * 5;
//         return `<tr><td>${s.rollNumber}</td><td>${s.name}</td><td>${'★'.repeat(Math.round(s.rating))}${'☆'.repeat(5 - Math.round(s.rating))} ${s.rating}</td><td style="color:${att ? '#16a34a' : '#dc2626'};font-weight:600">${att ? '✓ Attained' : '✗ Not Attained'}</td></tr>`;
//       }).join('');
//       return `<h4 style="margin:16px 0 4px;font-size:12px;color:#374151">${ic.code} — ${ic.statement?.substring(0, 90) || ''}</h4>
//       <p style="font-size:10px;color:#64748b;margin:0 0 8px">Avg: ${ic.statistics.averageRating.toFixed(2)}/5 &nbsp;|&nbsp; Class Attainment: ${ic.statistics.classAttainment.toFixed(1)}% &nbsp;|&nbsp; Level ${ic.indirectAttainment.level} (${ic.indirectAttainment.label}) &nbsp;|&nbsp; ${ic.statistics.attainedStudents}/${ic.statistics.totalStudents} students attained</p>
//       <table><thead><tr><th>Roll No</th><th>Student</th><th>Rating</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`;
//     }).join('');
//     indirectSection = `<h2>Indirect Assessment — Student Ratings</h2>${tables}`;
//   }

//   const cloHeaders = cloList.map(c => `<th colspan="2">${c.code}</th>`).join('');
//   const cloSubHeaders = cloList.map(() => `<th>Score%</th><th>Lvl</th>`).join('');
//   const studentRows = performanceData.students.slice(0, 100).map(s => {
//     const cells = cloList.map(clo => {
//       const perf = s.cloPerformance[clo.id];
//       const pct = perf?.averagePercentage ?? perf?.percentage ?? 0;
//       const lvl = perf?.attainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
//       return `<td>${pct.toFixed(1)}%</td><td>L${lvl}</td>`;
//     }).join('');
//     return `<tr><td>${s.rollNumber}</td><td>${s.name}</td>${cells}<td><strong>${s.totalPercentage.toFixed(1)}%</strong></td></tr>`;
//   }).join('');

//   return `<!DOCTYPE html><html><head><title>${courseCode} Course Level Attainment Report</title>
//   <style>body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px}
//   h1{font-size:20px;color:#1e40af;margin-bottom:0}
//   h2{font-size:16px;color:#1e293b;margin:20px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:5px}
//   h3{font-size:14px;color:#334155;margin:15px 0 5px}
//   h4{font-size:11px;margin:14px 0 4px}
//   .subtitle{font-size:14px;color:#1e40af;margin-top:2px;margin-bottom:5px}
//   .meta{font-size:10px;color:#64748b;margin-bottom:5px}
//   .faculty-line{font-size:11px;color:#334155;background:#f8fafc;padding:6px 10px;border-radius:4px;margin:8px 0;border-left:4px solid #1e40af}
//   .summary-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin:10px 0}
//   .sum-item{display:flex;flex-direction:column;gap:2px}
//   .sum-lbl{font-size:9px;color:#6b7280;text-transform:uppercase}
//   .sum-val{font-size:14px;font-weight:700}
//   .formula{background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin:8px 0;font-size:10px;color:#78350f}
//   table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10px}
//   th{background:#f1f5f9;padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-weight:600}
//   td{padding:5px 8px;border:1px solid #e2e8f0}
//   tr:nth-child(even){background:#f8fafc}
//   .print-only-header{display:block}
//   @media print{body{margin:0}.faculty-line{border-left:4px solid #000}}
//   </style>
//   </head><body>
//   <h1>${courseCode} — ${courseName}</h1>
//   <h3 class="subtitle">Course Level Attainment Report</h3>
//   <div class="meta">Semester: ${semester} &nbsp;|&nbsp; Academic Year: ${year} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
//   ${facultyNames ? `<div class="faculty-line"><strong>Faculty:</strong> ${facultyNames} ${coordinator ? ` (Coordinator: ${coordinator.name})` : ''}</div>` : ''}
//   <div class="summary-grid">
//     <div class="sum-item"><span class="sum-lbl">Overall Direct</span><span class="sum-val">${overallDirect.toFixed(1)}%</span></div>
//     ${hasIndirect ? `<div class="sum-item"><span class="sum-lbl">Overall Indirect</span><span class="sum-val">${overallIndirect.toFixed(1)}%</span></div>` : '<div></div>'}
//     <div class="sum-item"><span class="sum-lbl">Final Attainment</span><span class="sum-val" style="color:${lc[overallFinalLevel]}">${overallFinal.toFixed(1)}% — L${overallFinalLevel} ${levelLabel(overallFinalLevel)}</span></div>
//   </div>
//   <div class="formula"><strong>Formula:</strong> ${hasIndirect ? `0.8 × ${overallDirect.toFixed(1)}% (Direct) + 0.2 × ${overallIndirect.toFixed(1)}% (Indirect) = ${overallFinal.toFixed(1)}%` : 'Direct Attainment Only — no indirect data uploaded'}</div>
//   <h2>CLO Attainment Summary</h2>
//   <table><thead><tr><th>CLO</th><th>Bloom's</th><th>Threshold</th><th>Attained</th><th>Direct %</th><th>Direct Level</th>${hasIndirect ? '<th>Avg Rating</th><th>Indirect %</th><th>Indirect Level</th>' : ''}<th>Final %</th><th>Final Level</th></tr></thead><tbody>${cloRows}</tbody></table>
//   ${indirectSection}
//   <h2>Student-wise CLO Performance${performanceData.students.length > 100 ? ' (first 100)' : ''}</h2>
//   <table><thead><tr><th>Roll No.</th><th>Name</th>${cloHeaders}<th>Overall %</th></tr><tr><th></th><th></th>${cloSubHeaders}<th></th></tr></thead><tbody>${studentRows}</tbody></table>
//   </body></html>`;
// };

// const downloadBlob = (content, fileName, mimeType) => {
//   const blob = new Blob([content], { type: mimeType });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url; a.download = fileName;
//   document.body.appendChild(a); a.click();
//   document.body.removeChild(a); URL.revokeObjectURL(url);
// };

// // ─── Section ──────────────────────────────────────────────────────────────────
// const Section = ({ title, icon: Icon, sectionKey, expanded, onToggle, children, badge }) => (
//   <>
//     <div className="section-header" onClick={() => onToggle(sectionKey)}>
//       <h3><Icon size={20} /> {title}{badge && <span className="section-badge">{badge}</span>}</h3>
//       {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
//     </div>
//     {expanded && children}
//   </>
// );

// // ─── CLO performance helpers ──────────────────────────────────────────────────
// const analyzeCLOPerformance = (marksData, studentsData, closData, courseInfo) => {
//   if (!marksData || !studentsData) return null;
//   const marksStudents = marksData.students || [];
//   const assessmentClos = marksData.clos || [];
//   const studentMap = {};
//   studentsData.forEach(s => { studentMap[s.id] = s; });
//   const cloMap = {};
//   closData.forEach(c => { cloMap[c.id] = { threshold: c.attainmentThreshold || 50, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel }; });
//   const cloAnalysis = {};
//   const studentCLOPerformance = {};
//   marksStudents.forEach(ms => {
//     const sid = ms.studentId;
//     if (!studentCLOPerformance[sid]) studentCLOPerformance[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', cloPerformance: {}, totalObtained: 0, totalMax: 0 };
//   });
//   assessmentClos.forEach(clo => {
//     const cloId = clo.id;
//     const maxMarks = clo.marksAllocated || 0;
//     const threshold = cloMap[cloId]?.threshold || 50;
//     const cloCode = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0, 4)}`;
//     const cloStudentScores = [];
//     marksStudents.forEach(ms => {
//       const sid = ms.studentId;
//       const mData = (ms.marksByClo || {})[cloId];
//       const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0;
//       const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;
//       const attained = percentage >= threshold;
//       const attainmentLevel = calculateAttainmentLevel(percentage, threshold);
//       if (studentCLOPerformance[sid]) { studentCLOPerformance[sid].cloPerformance[cloId] = { obtained, maxMarks, percentage, threshold, attained, attainmentLevel, code: cloCode, statement: cloMap[cloId]?.statement || '' }; studentCLOPerformance[sid].totalObtained += obtained; studentCLOPerformance[sid].totalMax += maxMarks; }
//       cloStudentScores.push({ studentId: sid, rollNumber: ms.rollNumber || 'N/A', name: ms.name || 'Unknown', obtained, maxMarks, percentage, attained, attainmentLevel });
//     });
//     const attainedStudents = cloStudentScores.filter(s => s.attained).length;
//     const totalStudents = cloStudentScores.length;
//     const classAttainment = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
//     cloAnalysis[cloId] = { id: cloId, code: cloCode, statement: cloMap[cloId]?.statement || clo.statement || '', bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '', maxMarks, threshold, studentScores: cloStudentScores, statistics: { totalStudents, attainedStudents, classAttainment, averageScore: totalStudents > 0 ? cloStudentScores.reduce((s, x) => s + x.percentage, 0) / totalStudents : 0, maxScore: totalStudents > 0 ? Math.max(...cloStudentScores.map(s => s.percentage)) : 0, minScore: totalStudents > 0 ? Math.min(...cloStudentScores.map(s => s.percentage)) : 0, attainmentDistribution: { level0: cloStudentScores.filter(s => s.attainmentLevel === 0).length, level1: cloStudentScores.filter(s => s.attainmentLevel === 1).length, level2: cloStudentScores.filter(s => s.attainmentLevel === 2).length, level3: cloStudentScores.filter(s => s.attainmentLevel === 3).length } }, directAttainment: { percentage: classAttainment, level: classAttainmentToLevel(classAttainment), label: levelLabel(classAttainmentToLevel(classAttainment)) } };
//   });
//   const students = Object.values(studentCLOPerformance).map(s => ({ ...s, totalPercentage: s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0 }));
//   return { assessment: { id: marksData.assessment?.id || marksData.id, title: marksData.assessment?.title || marksData.title || 'Assessment', type: marksData.assessment?.type || marksData.type, maxMarks: marksData.assessment?.maxMarks || marksData.maxMarks, duration: marksData.assessment?.duration || marksData.duration, conductedOn: marksData.assessment?.conductedOn || marksData.conductedOn }, course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year }, clos: assessmentClos.map(c => ({ id: c.id, code: cloMap[c.id]?.code || c.code || `CLO-${c.id.slice(0, 4)}`, statement: cloMap[c.id]?.statement || c.statement || '', bloomLevel: cloMap[c.id]?.bloomLevel || c.bloomLevel || '', maxMarks: c.marksAllocated || 0, threshold: cloMap[c.id]?.threshold || 50 })), cloAnalysis, students, generatedAt: new Date().toISOString() };
// };

// const combineCLOPerformance = (assessmentsData, studentsData, closData, courseInfo, finalizedAssessments) => {
//   if (!assessmentsData || assessmentsData.length === 0) return null;
//   const studentMap = {};
//   studentsData.forEach(s => { studentMap[s.id] = s; });
//   const cloMap = {};
//   closData.forEach(c => { cloMap[c.id] = { threshold: c.attainmentThreshold || 50, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel }; });
//   const allAssessments = finalizedAssessments.map((fa, idx) => { const m = assessmentsData[idx]; return { id: fa.id, title: fa.title || m?.assessment?.title || m?.title || 'Assessment', type: fa.type || m?.assessment?.type || m?.type, maxMarks: fa.maxMarks || m?.assessment?.maxMarks || m?.maxMarks }; });
//   const combinedCloAnalysis = {};
//   const studentCombinedPerformance = {};
//   const assessmentWiseStats = [];
//   assessmentsData.forEach((assessmentData, idx) => {
//     const marksStudents = assessmentData.students || [];
//     const assessmentClos = assessmentData.clos || [];
//     const realAssessmentId = finalizedAssessments[idx]?.id || assessmentData.assessment?.id || assessmentData.id;
//     const assessmentTitle = finalizedAssessments[idx]?.title || assessmentData.assessment?.title || assessmentData.title;
//     const studentScores = marksStudents.map(s => { let tot = 0, mx = 0; Object.values(s.marksByClo || {}).forEach(m => { tot += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; }); return mx > 0 ? (tot / mx) * 100 : 0; });
//     assessmentWiseStats.push({ assessment: { id: realAssessmentId, title: assessmentTitle, type: finalizedAssessments[idx]?.type || assessmentData.assessment?.type || assessmentData.type, maxMarks: finalizedAssessments[idx]?.maxMarks || assessmentData.assessment?.maxMarks || assessmentData.maxMarks }, classAverage: studentScores.length > 0 ? studentScores.reduce((a, b) => a + b, 0) / studentScores.length : 0, totalStudents: marksStudents.length, clos: assessmentClos.map(c => ({ id: c.id, code: cloMap[c.id]?.code || c.code, maxMarks: c.marksAllocated })) });
//     assessmentClos.forEach(clo => {
//       const cloId = clo.id; const maxMarks = clo.marksAllocated || 0; const threshold = cloMap[cloId]?.threshold || 50; const cloCode = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0, 4)}`;
//       if (!combinedCloAnalysis[cloId]) combinedCloAnalysis[cloId] = { id: cloId, code: cloCode, statement: cloMap[cloId]?.statement || clo.statement || '', bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '', threshold, assessments: [], studentScores: {}, totalOccurrences: 0 };
//       combinedCloAnalysis[cloId].assessments.push({ id: realAssessmentId, title: assessmentTitle, maxMarks });
//       marksStudents.forEach(ms => {
//         const sid = ms.studentId; const mData = (ms.marksByClo || {})[cloId]; const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0; const percentage = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0; const attained = percentage >= threshold; const attainmentLevel = calculateAttainmentLevel(percentage, threshold);
//         if (!combinedCloAnalysis[cloId].studentScores[sid]) combinedCloAnalysis[cloId].studentScores[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', scores: [], percentages: [], attainedCount: 0, totalObtained: 0, totalMax: 0 };
//         const scd = combinedCloAnalysis[cloId].studentScores[sid]; scd.scores.push({ assessmentId: realAssessmentId, assessmentTitle, obtained, maxMarks, percentage, attained, attainmentLevel }); scd.percentages.push(percentage); scd.totalObtained += obtained; scd.totalMax += maxMarks; if (attained) scd.attainedCount += 1;
//       });
//       combinedCloAnalysis[cloId].totalOccurrences += 1;
//     });
//     marksStudents.forEach(ms => {
//       const sid = ms.studentId;
//       if (!studentCombinedPerformance[sid]) studentCombinedPerformance[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', cloPerformance: {}, totalObtained: 0, totalMax: 0, assessmentsAttempted: 0, assessmentScores: [] };
//       let tot = 0, mx = 0; Object.values(ms.marksByClo || {}).forEach(m => { tot += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; });
//       studentCombinedPerformance[sid].assessmentScores.push({ assessmentId: realAssessmentId, assessmentTitle, totalPercentage: mx > 0 ? (tot / mx) * 100 : 0, obtained: tot, maxMarks: mx }); studentCombinedPerformance[sid].assessmentsAttempted += 1;
//     });
//   });
//   Object.keys(combinedCloAnalysis).forEach(cloId => {
//     const clo = combinedCloAnalysis[cloId]; const arr = Object.values(clo.studentScores); const totalStudents = arr.length;
//     arr.forEach(s => { s.averagePercentage = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0; s.overallAttained = s.attainedCount >= Math.ceil(clo.totalOccurrences * 0.7); s.overallAttainmentLevel = calculateAttainmentLevel(s.averagePercentage, clo.threshold); });
//     const attainedStudents = arr.filter(s => s.overallAttained).length; const classAttainment = totalStudents > 0 ? (attainedStudents / totalStudents) * 100 : 0;
//     clo.statistics = { totalStudents, attainedStudents, classAttainment, averageScore: totalStudents > 0 ? arr.reduce((s, x) => s + x.averagePercentage, 0) / totalStudents : 0, attainmentDistribution: { level0: arr.filter(s => s.overallAttainmentLevel === 0).length, level1: arr.filter(s => s.overallAttainmentLevel === 1).length, level2: arr.filter(s => s.overallAttainmentLevel === 2).length, level3: arr.filter(s => s.overallAttainmentLevel === 3).length } };
//     clo.directAttainment = { percentage: classAttainment, level: classAttainmentToLevel(classAttainment), label: levelLabel(classAttainmentToLevel(classAttainment)) };
//     arr.forEach(s => { if (studentCombinedPerformance[s.studentId]) { studentCombinedPerformance[s.studentId].cloPerformance[cloId] = { code: clo.code, averagePercentage: s.averagePercentage, overallAttained: s.overallAttained, attainmentLevel: s.overallAttainmentLevel, assessmentsCount: clo.totalOccurrences, attainedCount: s.attainedCount, percentages: s.percentages, scores: s.scores }; studentCombinedPerformance[s.studentId].totalObtained += s.totalObtained; studentCombinedPerformance[s.studentId].totalMax += s.totalMax; } });
//   });
//   const students = Object.values(studentCombinedPerformance).map(s => { const totalPercentage = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0; const closAttained = Object.values(s.cloPerformance).filter(c => c.overallAttained).length; const totalClos = Object.keys(s.cloPerformance).length; return { ...s, totalPercentage, closAttained, totalClos, overallAttained: closAttained >= Math.ceil(totalClos * 0.7) }; });
//   return { assessments: allAssessments, assessmentWiseStats, course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year }, clos: Object.values(combinedCloAnalysis).map(c => ({ id: c.id, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel, threshold: c.threshold })), cloAnalysis: combinedCloAnalysis, students, generatedAt: new Date().toISOString() };
// };

// // ─── Main Component ───────────────────────────────────────────────────────────
// const StudentPerformanceAnalysis = ({ course, assessmentId = null, onClose, standalone = true, showHeader = true, className = '' }) => {
//   const [selectedAssessment, setSelectedAssessment] = useState(null);
//   const [availableAssessments, setAvailableAssessments] = useState([]);
//   const [performanceData, setPerformanceData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState(null);
//   const [successMessage, setSuccessMessage] = useState('');
//   const [analysisMode, setAnalysisMode] = useState('all');
//   const [isReportSubmitted, setIsReportSubmitted] = useState(false);
//   const [assignedFaculties, setAssignedFaculties] = useState([]);
//   const analysisModeRef = useRef('all');
//   const finalizedAssessmentsRef = useRef([]);
//   const [indirectData, setIndirectData] = useState(null);
//   const [indirectCloAnalysis, setIndirectCloAnalysis] = useState(null);
//   const [indirectLoading, setIndirectLoading] = useState(false);
//   const [closData, setClosData] = useState([]);
//   const [cloListWithFinal, setCloListWithFinal] = useState([]);
//   const [expandedSections, setExpandedSections] = useState({ assessmentDetails: true, quickGlance: true, cloWiseAnalysis: true, attainmentSummary: true, studentPerformance: true, indirectAssessment: true });

//   const setMode = m => { analysisModeRef.current = m; setAnalysisMode(m); };
//   const toggleSection = k => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

//   const loadIndirectData = useCallback(async (sem, yr) => {
//     if (!course?.id) return;
//     setIndirectLoading(true);
//     try {
//       const res = await facultyApi.getIndirectAssessments(course.id, { semester: sem || course.semester, year: yr || course.year });
//       const unwrapped = getResponseData(res);
//       const rawArray = (Array.isArray(unwrapped?.rawData) && unwrapped.rawData) || (Array.isArray(unwrapped?.data?.rawData) && unwrapped.data.rawData) || (Array.isArray(unwrapped) && unwrapped) || null;
//       setIndirectData(rawArray?.length > 0 ? rawArray : null);
//     } catch { setIndirectData(null); }
//     finally { setIndirectLoading(false); }
//   }, [course]);

//   useEffect(() => {
//     if (!performanceData) { setCloListWithFinal([]); return; }
//     setCloListWithFinal(computeFinalAttainment(Object.values(performanceData.cloAnalysis), indirectCloAnalysis));
//   }, [performanceData, indirectCloAnalysis]);

//   useEffect(() => {
//     if (Array.isArray(indirectData) && indirectData.length > 0 && closData.length > 0) setIndirectCloAnalysis(analyzeIndirectAssessment(indirectData, closData));
//     else setIndirectCloAnalysis(null);
//   }, [indirectData, closData]);

//   const checkReportSubmissionStatus = useCallback(async () => {
//     if (!performanceData || analysisModeRef.current !== 'all') return;
//     try {
//       const assessmentIds = performanceData.assessments?.map(a => a.id) || [];
//       const params = new URLSearchParams({ courseId: performanceData.course.id, semester: performanceData.course.semester, year: performanceData.course.year });
//       if (assessmentIds.length > 0) params.append('assessmentIds', assessmentIds.join(','));
//       const response = await facultyApi.checkReportSubmission(params);
//       setIsReportSubmitted(response.data.isSubmitted);
//     } catch { setIsReportSubmitted(false); }
//   }, [performanceData]);

//   const fetchAssessmentMarks = useCallback(async (asmtId, studentsData, clos) => {
//     const marksData = getResponseData(await assessmentApi.getAssessmentMarks(asmtId));
//     if (!marksData) throw new Error('No marks data received');
//     return analyzeCLOPerformance(marksData, studentsData, clos, course);
//   }, [course]);

//   const fetchAllAssessmentsPerformance = useCallback(async (finalized, studentsData, clos) => {
//     const results = await Promise.all(finalized.map(a => assessmentApi.getAssessmentMarks(a.id).then(r => getResponseData(r)).catch(() => null)));
//     const valid = results.filter(d => d && d.students);
//     const validFinalized = finalized.filter((_, i) => results[i] && results[i].students);
//     if (valid.length === 0) throw new Error('No valid marks data found for any assessment');
//     return combineCLOPerformance(valid, studentsData, clos, course, validFinalized);
//   }, [course]);

//   const fetchAllData = useCallback(async () => {
//     if (!course) { setError('Please select a course'); return; }
//     try {
//       setLoading(true); setError(null); setIsReportSubmitted(false);
      
//       // Fetch course assessments, students, CLOs, and faculty assignments in parallel
//       const [assessmentsRes, studentsRes, closRes, facultyRes] = await Promise.all([
//         assessmentApi.getCourseAssessments(course.id, { semester: course.semester, year: course.year }),
//         assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }),
//         assessmentApi.getCourseClos(course.id),
//         fetchAssignedFaculties(course.id, course.semester, course.year)
//       ]);
      
//       const assessmentsData = getResponseData(assessmentsRes)?.assessments || [];
//       const studentsData = getResponseData(studentsRes)?.students || [];
//       const clos = getResponseData(closRes) || [];
      
//       setClosData(clos);
//       setAssignedFaculties(facultyRes);
      
//       const finalized = assessmentsData.filter(a => a.isMarksFinalized === true);
//       setAvailableAssessments(finalized);
//       finalizedAssessmentsRef.current = finalized;
      
//       if (finalized.length === 0) { setError('No finalized assessments found'); return; }
      
//       if (assessmentId) {
//         const target = finalized.find(a => a.id === assessmentId);
//         if (target) { setSelectedAssessment(target); setMode('single'); setPerformanceData(await fetchAssessmentMarks(target.id, studentsData, clos)); }
//         else setError('Assessment not found or not finalized');
//       } else {
//         setMode('all');
//         setPerformanceData(await fetchAllAssessmentsPerformance(finalized, studentsData, clos));
//         await loadIndirectData(course.semester, course.year);
//       }
//     } catch (err) { setError(err.response?.data?.message || 'Failed to load data'); }
//     finally { setLoading(false); }
//   }, [course, assessmentId, fetchAssessmentMarks, fetchAllAssessmentsPerformance, loadIndirectData]);

//   useEffect(() => { if (course) fetchAllData(); }, [course, assessmentId, fetchAllData]);
//   useEffect(() => { if (performanceData && analysisMode === 'all') checkReportSubmissionStatus(); }, [performanceData, analysisMode, checkReportSubmissionStatus]);

//   const handleAssessmentSelect = async (value) => {
//     setIsReportSubmitted(false); setError(null); setPerformanceData(null); setLoading(true);
//     try {
//       const [studentsRes, closRes] = await Promise.all([assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }), assessmentApi.getCourseClos(course.id)]);
//       const studentsData = getResponseData(studentsRes)?.students || [];
//       const clos = getResponseData(closRes) || [];
//       setClosData(clos);
//       if (value === 'all') { setMode('all'); setPerformanceData(await fetchAllAssessmentsPerformance(finalizedAssessmentsRef.current, studentsData, clos)); await loadIndirectData(course.semester, course.year); }
//       else { const target = availableAssessments.find(a => a.id === value); if (target) { setSelectedAssessment(target); setMode('single'); setIndirectData(null); setIndirectCloAnalysis(null); setPerformanceData(await fetchAssessmentMarks(target.id, studentsData, clos)); } }
//     } catch { setError('Failed to load assessment data'); }
//     finally { setLoading(false); }
//   };

//   const handleSubmitToHOD = async () => {
//     if (!performanceData || analysisModeRef.current !== 'all') return;
//     try {
//       setSubmitting(true); setError(null); setSuccessMessage('');
//       await facultyApi.submitReportToHOD({
//         reportName: `${performanceData.course.code} - CLO Attainment Report (Sem ${performanceData.course.semester} ${performanceData.course.year})`,
//         reportType: "COMBINED",
//         academicYear: `${performanceData.course.year}-${(performanceData.course.year + 1).toString().slice(-2)}`,
//         reportParameters: buildHODPayload(performanceData, cloListWithFinal, indirectCloAnalysis)
//       });
//       setIsReportSubmitted(true);
//       setSuccessMessage('Report submitted to HOD successfully!');
//       setTimeout(() => setSuccessMessage(''), 5000);
//     } catch (err) { setError(err.response?.data?.message || 'Failed to submit report to HOD'); }
//     finally { setSubmitting(false); }
//   };


//   const handleExportPDF = () => {
//     if (!performanceData) return;
//     const html = buildPDFHTML(performanceData, cloListWithFinal, indirectCloAnalysis, assignedFaculties);
//     const win = window.open('', '_blank', 'width=1000,height=750');
//     if (!win) { alert('Please allow popups for PDF export'); return; }
//     win.document.write(html); win.document.close();
//     win.onload = () => { win.focus(); win.print(); };
//   };

//   if (loading) return <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}><div className="loading-state"><div className="spinner" /><p>Loading CLO performance data…</p></div></div>;
//   if (error && !performanceData) return <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}><div className="error-state"><AlertTriangle size={48} /><h3>Analysis Unavailable</h3><p>{error}</p>{onClose && <button className="btn btn-outline" onClick={onClose}>Close</button>}</div></div>;
//   if (!performanceData) return <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}><div className="empty-state"><Target size={64} /><h3>No CLO Performance Data Available</h3><p>No finalized assessments found for this course.</p></div></div>;

//   const isAllMode = analysisMode === 'all';
//   const activeCloList = cloListWithFinal.length ? cloListWithFinal : Object.values(performanceData.cloAnalysis);

//   return (
//     <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
//       {showHeader && (
//         <PerformanceHeader 
//           isAllMode={isAllMode} 
//           performanceData={performanceData} 
//           availableAssessments={availableAssessments} 
//           selectedAssessment={selectedAssessment} 
//           submitting={submitting} 
//           isReportSubmitted={isReportSubmitted} 
//           hasIndirectData={!!indirectCloAnalysis} 
//           onAssessmentSelect={handleAssessmentSelect} 
//           onSubmitToHOD={handleSubmitToHOD} 
//           onExportPDF={handleExportPDF} 
//           onClose={onClose} 
//           assignedFaculties={assignedFaculties}
//         />
//       )}

//       {!showHeader && isAllMode && (
//         <div className="actions-bar-no-header">
//           <button className={`btn-submit-hod ${isReportSubmitted ? 'btn-submitted' : ''}`} onClick={handleSubmitToHOD} disabled={submitting || isReportSubmitted}>
//             <span>{submitting ? 'Submitting...' : isReportSubmitted ? 'Already Submitted' : 'Submit to HOD'}</span>
//             {isReportSubmitted && <CheckCircle size={16} className="submitted-check" />}
//           </button>
//           <button className="btn-export btn-export-pdf" onClick={handleExportPDF}><span>Export PDF</span></button>
//         </div>
//       )}

//       {successMessage && <div className="success-message"><CheckCircle size={20} /><span>{successMessage}</span></div>}
//       {error && performanceData && <div className="error-inline"><AlertTriangle size={20} /><span>{error}</span></div>}

//       <div className="analysis-content">
//         <div className="assessment-info-banner">
//           <div className="info-item"><BookOpen size={18} /><span className="label">Course:</span><span className="value">{performanceData.course.code} — {performanceData.course.name}</span></div>
//           <div className="info-item"><Users size={18} /><span className="label">Students:</span><span className="value">{performanceData.students.length}</span></div>
//           <div className="info-item"><Layers size={18} /><span className="label">CLOs:</span><span className="value">{activeCloList.length}</span></div>
//           {!isAllMode && performanceData.assessment && (<><div className="info-item"><Star size={18} /><span className="label">Max Marks:</span><span className="value">{performanceData.assessment.maxMarks}</span></div>{performanceData.assessment.duration && <div className="info-item"><Clock size={18} /><span className="label">Duration:</span><span className="value">{performanceData.assessment.duration} mins</span></div>}</>)}
//           {isAllMode && (<>
//             <div className="info-item"><FileText size={18} /><span className="label">Assessments:</span><span className="value">{performanceData.assessments?.length || 0}</span></div>
//             <div className="info-item"><Upload size={18} /><span className="label">Indirect:</span><span className={`value ${indirectCloAnalysis ? 'text-success' : 'text-muted'}`}>{indirectLoading ? 'Loading…' : indirectCloAnalysis ? '✓ Loaded' : 'Not uploaded'}</span></div>
//             {assignedFaculties.length > 0 && (
//               <div className="info-item faculty-info">
//                 <UsersIcon size={18} />
//                 <span className="label">Faculty:</span>
//                 <span className="value faculty-names" title={assignedFaculties.map(f => f.email).join(', ')}>
//                   {assignedFaculties.map(f => f.name).join(', ')}
//                 </span>
//               </div>
//             )}
//           </>)}
//         </div>

//         <Section title="Assessment Details" icon={FileText} sectionKey="assessmentDetails" expanded={expandedSections.assessmentDetails} onToggle={toggleSection}>
//           <div className="assessment-details-section"><AssessmentDetails isAllMode={isAllMode} performanceData={performanceData} /></div>
//         </Section>

//         {isAllMode && (
//           <Section
//             title="Indirect Assessment"
//             icon={Upload}
//             sectionKey="indirectAssessment"
//             expanded={expandedSections.indirectAssessment}
//             onToggle={toggleSection}
//             badge={indirectCloAnalysis ? `✓ ${Object.keys(indirectCloAnalysis).length} CLOs analysed` : 'Pending upload'}
//           >
//             <IndirectAssessmentPanel
//               indirectData={indirectData}
//               indirectCloAnalysis={indirectCloAnalysis}
//               cloListWithFinal={cloListWithFinal}
//               closData={closData}
//               course={course}
//               semester={performanceData.course.semester}
//               year={performanceData.course.year}
//               indirectLoading={indirectLoading}
//               facultyApi={facultyApi}
//               onUploaded={() => loadIndirectData(performanceData.course.semester, performanceData.course.year)}
//             />
//           </Section>
//         )}

//         <Section title="Quick Glance: CLO Attainment Dashboard" icon={BarChart} sectionKey="quickGlance" expanded={expandedSections.quickGlance} onToggle={toggleSection}>
//           <QuickGlanceDashboard cloList={activeCloList} />
//         </Section>

//         <Section title="CLO-wise Attainment Analysis" icon={Target} sectionKey="cloWiseAnalysis" expanded={expandedSections.cloWiseAnalysis} onToggle={toggleSection}>
//           <CLOAnalysisSection cloList={activeCloList} calculateAttainmentLevel={calculateAttainmentLevel} />
//         </Section>


//         <Section title="Student-wise CLO Performance" icon={Users} sectionKey="studentPerformance" expanded={expandedSections.studentPerformance} onToggle={toggleSection}>
//           <StudentPerformanceTable performanceData={performanceData} cloList={activeCloList} isAllMode={isAllMode} calculateAttainmentLevel={calculateAttainmentLevel} />
//         </Section>

        
//         <Section title="CLO Attainment Summary" icon={Award} sectionKey="attainmentSummary" expanded={expandedSections.attainmentSummary} onToggle={toggleSection}>
//           <AttainmentSummary cloList={activeCloList} hasIndirectData={!!indirectCloAnalysis} isSingleAssessment={!isAllMode} />
//         </Section>
//       </div>
//     </div>
//   );
// };

// export default StudentPerformanceAnalysis;// src/components/faculty/StudentPerformanceAnalysis.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart, Users, Award, AlertTriangle, CheckCircle,
  Target, ChevronDown, ChevronRight, FileText, Layers,
  BookOpen, Clock, Star, Upload, Info, X, Activity,
  UserCheck
} from 'lucide-react';
import assessmentApi from "../../apis/assessments/assessment";
import facultyApi from "../../apis/faculty";
import HODAPI from '../../apis/HOD';
import PerformanceHeader from './Performance/PerformanceHeader';

// ─── Response unwrapper ───────────────────────────────────────────────────────
const getResponseData = (r) => {
  if (r?.data?.data) return r.data.data;
  if (r?.data)       return r.data;
  return r;
};

// ─── Faculty fetching (from old code) ────────────────────────────────────────
const fetchAssignedFaculties = async (courseId, semester, year) => {
  try {
    const facRes = await HODAPI.assignments.getCourseAssignments(
      courseId, String(semester), String(year)
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
    if (err.response?.status === 404) return [];
    console.error('Error fetching faculty assignments:', err);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL SYSTEM  (0-3)
// L0 Low        pct < threshold
// L1 Good       threshold      <= pct < threshold+10
// L2 Very Good  threshold+10   <= pct < threshold+20
// L3 Excellent  pct >= threshold+20
// ═══════════════════════════════════════════════════════════════════════════════
export const calculateAttainmentLevel = (percentage, threshold) => {
  if (percentage < threshold)       return 0;
  if (percentage < threshold + 10)  return 1;
  if (percentage < threshold + 20)  return 2;
  return 3;
};

const LEVEL_LABELS = ['Low', 'Good', 'Very Good', 'Excellent'];
const LEVEL_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#22c55e'];
const LEVEL_BGS    = ['#fef2f2', '#fff7ed', '#eff6ff', '#f0fdf4'];
const LEVEL_BORDER = ['#fecaca', '#fed7aa', '#bfdbfe', '#bbf7d0'];
const levelLabel   = (l) => LEVEL_LABELS[l]  ?? 'Low';
const levelColor   = (l) => LEVEL_COLORS[l]  ?? '#94a3b8';
const levelBg      = (l) => LEVEL_BGS[l]     ?? '#f8fafc';
const levelBorder  = (l) => LEVEL_BORDER[l]  ?? '#e2e8f0';

const getThreshold = (cloEntry) => cloEntry?.attainmentThreshold ?? 50;
const capRating = (raw) => {
  const n = parseInt(raw, 10);
  if (isNaN(n) || n < 0) return 0;
  return Math.min(3, n);
};

// ─── CLO sort: numeric order by code (CLO1, CLO2, CLO10…) ────────────────────
const sortCLOs = (list) =>
  [...list].sort((a, b) => {
    const numA = parseInt((a.code || '').replace(/\D/g, ''), 10) || 0;
    const numB = parseInt((b.code || '').replace(/\D/g, ''), 10) || 0;
    if (numA !== numB) return numA - numB;
    return (a.code || '').localeCompare(b.code || '');
  });

// ─── Indirect Analysis ────────────────────────────────────────────────────────
const analyzeIndirectAssessment = (rawData, closData) => {
  if (!Array.isArray(rawData) || !rawData.length) return null;
  const cloMap = {};
  closData.forEach(c => { cloMap[c.id] = c; });
  const byClo = {};
  rawData.forEach(e => {
    if (!byClo[e.cloId]) byClo[e.cloId] = [];
    byClo[e.cloId].push({ ...e, rating: capRating(e.rating) });
  });
  const result = {};
  Object.entries(byClo).forEach(([cloId, entries]) => {
    const cloInfo  = entries[0].clo;
    const clo      = cloMap[cloId] || {};
    const n        = entries.length;
    const sumLvl   = entries.reduce((s, e) => s + e.rating, 0);
    const avgLevel = n > 0 ? sumLvl / n : 0;
    const dist     = { 0: 0, 1: 0, 2: 0, 3: 0 };
    entries.forEach(e => { dist[e.rating] = (dist[e.rating] || 0) + 1; });
    result[cloId] = {
      id: cloId, code: cloInfo?.code || '', statement: cloInfo?.statement || '',
      bloomLevel: cloInfo?.bloomLevel || '', threshold: getThreshold(clo),
      statistics: {
        totalStudents: n, avgLevel, distribution: dist,
        studentRatings: entries.map(e => ({
          studentId: e.student?.id, rollNumber: e.student?.rollNumber,
          name: e.student?.user?.name || 'Unknown', rating: e.rating, level: e.rating
        }))
      },
      indirectAttainment: {
        avgLevel, level: Math.min(3, Math.round(avgLevel)),
        label: levelLabel(Math.min(3, Math.round(avgLevel)))
      }
    };
  });
  return Object.keys(result).length ? result : null;
};

// ─── Final Attainment Merge ───────────────────────────────────────────────────
const computeFinalAttainment = (cloList, indirectCloAnalysis) =>
  cloList.map(clo => {
    const avgDirect   = clo.statistics.avgDirectLevel ?? 0;
    const ind         = indirectCloAnalysis?.[clo.id];
    const avgIndirect = ind?.indirectAttainment?.avgLevel ?? null;
    const hasIndirect = avgIndirect !== null;
    const finalScore  = hasIndirect ? 0.8 * avgDirect + 0.2 * avgIndirect : avgDirect;
    const finalLevel  = Math.min(3, Math.round(finalScore));
    return {
      ...clo,
      directAttainment: { ...clo.directAttainment, avgLevel: avgDirect },
      indirectAttainment: ind?.indirectAttainment || null,
      finalAttainment: {
        score: finalScore, level: finalLevel, label: levelLabel(finalLevel), hasIndirect,
        formula: hasIndirect
          ? `0.8 × ${avgDirect.toFixed(2)} + 0.2 × ${avgIndirect.toFixed(2)} = ${finalScore.toFixed(2)}`
          : `${avgDirect.toFixed(2)} (direct only)`
      }
    };
  });

// ─── Single Assessment Analysis ───────────────────────────────────────────────
const analyzeCLOPerformance = (marksData, studentsData, closData, courseInfo) => {
  if (!marksData || !studentsData) return null;
  const marksStudents  = marksData.students || [];
  const assessmentClos = marksData.clos || [];
  const studentMap = {};
  studentsData.forEach(s => { studentMap[s.id] = s; });
  const cloMap = {};
  closData.forEach(c => {
    cloMap[c.id] = { threshold: getThreshold(c), code: c.code, statement: c.statement, bloomLevel: c.bloomLevel };
  });
  const cloAnalysis = {};
  const studentPerf = {};
  marksStudents.forEach(ms => {
    const sid = ms.studentId;
    if (!studentPerf[sid]) studentPerf[sid] = {
      studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A',
      name: ms.name || studentMap[sid]?.name || 'Unknown', cloPerformance: {}, totalObtained: 0, totalMax: 0
    };
  });
  assessmentClos.forEach(clo => {
    const cloId     = clo.id;
    const maxMarks  = clo.marksAllocated || 0;
    const threshold = cloMap[cloId]?.threshold ?? 50;
    const cloCode   = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0,4)}`;
    const scores    = [];
    marksStudents.forEach(ms => {
      const sid      = ms.studentId;
      const mData    = (ms.marksByClo || {})[cloId];
      const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0;
      const pct      = maxMarks > 0 ? (obtained / maxMarks) * 100 : 0;
      const level    = calculateAttainmentLevel(pct, threshold);
      if (studentPerf[sid]) {
        studentPerf[sid].cloPerformance[cloId] = {
          obtained, maxMarks, percentage: pct, threshold, attained: pct >= threshold,
          attainmentLevel: level, code: cloCode, statement: cloMap[cloId]?.statement || ''
        };
        studentPerf[sid].totalObtained += obtained;
        studentPerf[sid].totalMax += maxMarks;
      }
      scores.push({ studentId: sid, rollNumber: ms.rollNumber || 'N/A', name: ms.name || 'Unknown', obtained, maxMarks, percentage: pct, attained: pct >= threshold, attainmentLevel: level });
    });
    const n = scores.length;
    const sumLvl = scores.reduce((s, x) => s + x.attainmentLevel, 0);
    const avgDirectLvl = n > 0 ? sumLvl / n : 0;
    const displayLvl   = Math.min(3, Math.round(avgDirectLvl));
    cloAnalysis[cloId] = {
      id: cloId, code: cloCode,
      statement: cloMap[cloId]?.statement || clo.statement || '',
      bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '',
      maxMarks, threshold, studentScores: scores,
      statistics: {
        totalStudents: n, attainedStudents: scores.filter(s => s.attained).length,
        classAttainment: n > 0 ? (scores.filter(s => s.attained).length / n) * 100 : 0,
        avgDirectLevel: avgDirectLvl,
        averageScore: n > 0 ? scores.reduce((s, x) => s + x.percentage, 0) / n : 0,
        attainmentDistribution: {
          level0: scores.filter(s => s.attainmentLevel === 0).length,
          level1: scores.filter(s => s.attainmentLevel === 1).length,
          level2: scores.filter(s => s.attainmentLevel === 2).length,
          level3: scores.filter(s => s.attainmentLevel === 3).length,
        }
      },
      directAttainment: { avgLevel: avgDirectLvl, level: displayLvl, label: levelLabel(displayLvl) }
    };
  });
  const students = Object.values(studentPerf).map(s => ({
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
    course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year },
    clos: sortCLOs(assessmentClos.map(c => ({
      id: c.id, code: cloMap[c.id]?.code || c.code || `CLO-${c.id.slice(0,4)}`,
      statement: cloMap[c.id]?.statement || c.statement || '',
      bloomLevel: cloMap[c.id]?.bloomLevel || c.bloomLevel || '',
      maxMarks: c.marksAllocated || 0, threshold: cloMap[c.id]?.threshold ?? 50
    }))),
    cloAnalysis, students, generatedAt: new Date().toISOString()
  };
};

// ─── Combined Analysis ────────────────────────────────────────────────────────
const combineCLOPerformance = (assessmentsData, studentsData, closData, courseInfo, finalizedAssessments) => {
  if (!assessmentsData || !assessmentsData.length) return null;
  const studentMap = {};
  studentsData.forEach(s => { studentMap[s.id] = s; });
  const cloMap = {};
  closData.forEach(c => {
    cloMap[c.id] = { threshold: getThreshold(c), code: c.code, statement: c.statement, bloomLevel: c.bloomLevel };
  });
  const allAssessments = finalizedAssessments.map((fa, idx) => {
    const m = assessmentsData[idx];
    return { id: fa.id, title: fa.title || m?.assessment?.title || m?.title || 'Assessment', type: fa.type || m?.assessment?.type || m?.type, maxMarks: fa.maxMarks || m?.assessment?.maxMarks || m?.maxMarks };
  });
  const combinedCLO     = {};
  const studentCombined = {};
  const assessmentWiseStats = [];
  assessmentsData.forEach((aData, idx) => {
    const marksStudents  = aData.students || [];
    const assessmentClos = aData.clos || [];
    const realId    = finalizedAssessments[idx]?.id    || aData.assessment?.id    || aData.id;
    const realTitle = finalizedAssessments[idx]?.title || aData.assessment?.title || aData.title;
    const rowScores = marksStudents.map(s => {
      let t = 0, mx = 0;
      Object.values(s.marksByClo || {}).forEach(m => { t += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; });
      return mx > 0 ? (t / mx) * 100 : 0;
    });
    assessmentWiseStats.push({
      assessment: { id: realId, title: realTitle, type: finalizedAssessments[idx]?.type || aData.assessment?.type, maxMarks: finalizedAssessments[idx]?.maxMarks || aData.assessment?.maxMarks },
      classAverage: rowScores.length > 0 ? rowScores.reduce((a, b) => a + b, 0) / rowScores.length : 0,
      totalStudents: marksStudents.length,
      clos: assessmentClos.map(c => ({ id: c.id, code: cloMap[c.id]?.code || c.code, maxMarks: c.marksAllocated }))
    });
    assessmentClos.forEach(clo => {
      const cloId     = clo.id;
      const maxMarks  = clo.marksAllocated || 0;
      const threshold = cloMap[cloId]?.threshold ?? 50;
      const cloCode   = cloMap[cloId]?.code || clo.code || `CLO-${cloId.slice(0,4)}`;
      if (!combinedCLO[cloId]) combinedCLO[cloId] = { id: cloId, code: cloCode, statement: cloMap[cloId]?.statement || clo.statement || '', bloomLevel: cloMap[cloId]?.bloomLevel || clo.bloomLevel || '', threshold, assessments: [], studentScores: {}, totalOccurrences: 0 };
      combinedCLO[cloId].assessments.push({ id: realId, title: realTitle, maxMarks });
      marksStudents.forEach(ms => {
        const sid      = ms.studentId;
        const mData    = (ms.marksByClo || {})[cloId];
        const obtained = mData ? parseFloat(mData.marksObtained) || 0 : 0;
        if (!combinedCLO[cloId].studentScores[sid]) combinedCLO[cloId].studentScores[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', totalObtained: 0, totalMax: 0 };
        combinedCLO[cloId].studentScores[sid].totalObtained += obtained;
        combinedCLO[cloId].studentScores[sid].totalMax += maxMarks;
      });
      combinedCLO[cloId].totalOccurrences += 1;
    });
    marksStudents.forEach(ms => {
      const sid = ms.studentId;
      if (!studentCombined[sid]) studentCombined[sid] = { studentId: sid, rollNumber: ms.rollNumber || studentMap[sid]?.rollNumber || 'N/A', name: ms.name || studentMap[sid]?.name || 'Unknown', cloPerformance: {}, totalObtained: 0, totalMax: 0, assessmentsAttempted: 0, assessmentScores: [] };
      let t = 0, mx = 0;
      Object.values(ms.marksByClo || {}).forEach(m => { t += parseFloat(m.marksObtained) || 0; mx += parseFloat(m.maxMarks) || 0; });
      studentCombined[sid].assessmentScores.push({ assessmentId: realId, assessmentTitle: realTitle, totalPercentage: mx > 0 ? (t / mx) * 100 : 0, obtained: t, maxMarks: mx });
      studentCombined[sid].assessmentsAttempted += 1;
    });
  });
  Object.keys(combinedCLO).forEach(cloId => {
    const clo = combinedCLO[cloId];
    const arr = Object.values(clo.studentScores);
    const n   = arr.length;
    const thr = clo.threshold;
    arr.forEach(s => {
      s.averagePercentage      = s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0;
      s.overallAttained        = s.averagePercentage >= thr;
      s.overallAttainmentLevel = calculateAttainmentLevel(s.averagePercentage, thr);
    });
    const attainedStudents = arr.filter(s => s.overallAttained).length;
    const sumLvl           = arr.reduce((s, x) => s + x.overallAttainmentLevel, 0);
    const avgDirectLevel   = n > 0 ? sumLvl / n : 0;
    const displayLevel     = Math.min(3, Math.round(avgDirectLevel));
    clo.statistics = {
      totalStudents: n, attainedStudents,
      classAttainment: n > 0 ? (attainedStudents / n) * 100 : 0,
      avgDirectLevel,
      averageScore: n > 0 ? arr.reduce((s, x) => s + x.averagePercentage, 0) / n : 0,
      attainmentDistribution: {
        level0: arr.filter(s => s.overallAttainmentLevel === 0).length,
        level1: arr.filter(s => s.overallAttainmentLevel === 1).length,
        level2: arr.filter(s => s.overallAttainmentLevel === 2).length,
        level3: arr.filter(s => s.overallAttainmentLevel === 3).length,
      }
    };
    clo.directAttainment = { avgLevel: avgDirectLevel, level: displayLevel, label: levelLabel(displayLevel) };
    arr.forEach(s => {
      if (studentCombined[s.studentId]) {
        studentCombined[s.studentId].cloPerformance[cloId] = { code: clo.code, averagePercentage: s.averagePercentage, overallAttained: s.overallAttained, attainmentLevel: s.overallAttainmentLevel };
        studentCombined[s.studentId].totalObtained += s.totalObtained;
        studentCombined[s.studentId].totalMax      += s.totalMax;
      }
    });
  });
  const students = Object.values(studentCombined).map(s => ({
    ...s,
    totalPercentage: s.totalMax > 0 ? (s.totalObtained / s.totalMax) * 100 : 0,
    closAttained: Object.values(s.cloPerformance).filter(c => c.overallAttained).length,
    totalClos:    Object.keys(s.cloPerformance).length
  }));
  return {
    assessments: allAssessments, assessmentWiseStats,
    course: { id: courseInfo.id, code: courseInfo.code, name: courseInfo.name, credits: courseInfo.credits, semester: courseInfo.semester, year: courseInfo.year },
    clos: sortCLOs(Object.values(combinedCLO).map(c => ({ id: c.id, code: c.code, statement: c.statement, bloomLevel: c.bloomLevel, threshold: c.threshold }))),
    cloAnalysis: combinedCLO, students, generatedAt: new Date().toISOString()
  };
};

// ─── HOD Payload ──────────────────────────────────────────────────────────────
const buildHODPayload = (performanceData, cloListWithFinal, indirectCloAnalysis) => {
  const hasInd = !!indirectCloAnalysis;
  const cD  = cloListWithFinal.length ? cloListWithFinal.reduce((s, c) => s + (c.statistics.avgDirectLevel ?? 0), 0) / cloListWithFinal.length : 0;
  const cI  = hasInd ? Object.values(indirectCloAnalysis).reduce((s, c) => s + c.indirectAttainment.avgLevel, 0) / Object.values(indirectCloAnalysis).length : null;
  const cF  = hasInd ? 0.8 * cD + 0.2 * cI : cD;
  const cFL = Math.min(3, Math.round(cF));
  return {
    courseId: performanceData.course.id, courseCode: performanceData.course.code, courseName: performanceData.course.name,
    semester: performanceData.course.semester, year: performanceData.course.year,
    assessmentIds: performanceData.assessments?.map(a => a.id).filter(Boolean) || [],
    generatedAt: new Date().toISOString(),
    courseSummary: {
      totalClos: cloListWithFinal.length, totalStudents: performanceData.students?.length || 0,
      avgDirectLevel: parseFloat(cD.toFixed(3)), avgIndirectLevel: cI !== null ? parseFloat(cI.toFixed(3)) : null,
      finalScore: parseFloat(cF.toFixed(3)), finalLevel: cFL, finalLevelLabel: levelLabel(cFL),
      hasIndirectAssessment: hasInd,
      formula: hasInd ? `0.8 × ${cD.toFixed(3)} + 0.2 × ${cI.toFixed(3)} = ${cF.toFixed(3)}` : `${cD.toFixed(3)} (direct only)`,
      attainmentScale: 'L0=Low(<threshold), L1=Good(+0-10%), L2=VeryGood(+10-20%), L3=Excellent(>=+20%)'
    },
    cloDetails: cloListWithFinal.map(clo => {
      const ind    = indirectCloAnalysis?.[clo.id];
      const fScore = clo.finalAttainment?.score ?? clo.statistics.avgDirectLevel ?? 0;
      const fLevel = clo.finalAttainment?.level ?? clo.directAttainment.level;
      const rawScores = Array.isArray(clo.studentScores) ? clo.studentScores : Object.values(clo.studentScores || {});
      return {
        cloId: clo.id, cloCode: clo.code, cloStatement: clo.statement, bloomLevel: clo.bloomLevel, threshold: clo.threshold,
        direct: {
          avgLevel: parseFloat((clo.statistics.avgDirectLevel ?? 0).toFixed(3)),
          level: clo.directAttainment.level, levelLabel: clo.directAttainment.label,
          attainedStudents: clo.statistics.attainedStudents, totalStudents: clo.statistics.totalStudents,
          studentScores: rawScores.map(s => ({ rollNumber: s.rollNumber, name: s.name, percentage: parseFloat((s.averagePercentage ?? s.percentage ?? 0).toFixed(2)), level: s.overallAttainmentLevel ?? s.attainmentLevel ?? 0 }))
        },
        indirect: ind ? {
          avgLevel: parseFloat(ind.indirectAttainment.avgLevel.toFixed(3)),
          level: ind.indirectAttainment.level, levelLabel: ind.indirectAttainment.label,
          totalStudents: ind.statistics.totalStudents, distribution: ind.statistics.distribution,
          studentRatings: ind.statistics.studentRatings.map(s => ({ rollNumber: s.rollNumber, name: s.name, rating: s.rating, level: s.level }))
        } : null,
        final: { score: parseFloat(fScore.toFixed(3)), level: fLevel, levelLabel: levelLabel(fLevel), formula: clo.finalAttainment?.formula || `${(clo.statistics.avgDirectLevel ?? 0).toFixed(3)} (direct only)` }
      };
    })
  };
};

// ─── PDF — matches old code: course heading, subtitle, faculty line, summary, CLO table, indirect, students ───
const buildPDFHTML = (performanceData, cloListWithFinal, indirectCloAnalysis, assignedFaculties) => {
  const cl  = cloListWithFinal.length ? sortCLOs(cloListWithFinal) : sortCLOs(Object.values(performanceData.cloAnalysis));
  const hi  = !!indirectCloAnalysis;
  const { code: cc, name: cn, semester, year } = performanceData.course;
  const lc  = LEVEL_COLORS;
  const cD  = cl.reduce((s, c) => s + (c.statistics.avgDirectLevel ?? 0), 0) / cl.length;
  const cI  = hi ? Object.values(indirectCloAnalysis).reduce((s, c) => s + c.indirectAttainment.avgLevel, 0) / Object.values(indirectCloAnalysis).length : null;
  const cF  = hi ? 0.8 * cD + 0.2 * cI : cD;
  const cFL = Math.min(3, Math.round(cF));

  const facultyNames = assignedFaculties.map(f => f.name).join(' · ');
  const coordinator  = assignedFaculties.find(f => f.isCoordinator);
  const facultyLine  = facultyNames
    ? `<div class="faculty-line"><strong>Faculty:</strong> ${facultyNames}${coordinator ? ` &nbsp;|&nbsp; <strong>Coordinator:</strong> ${coordinator.name}` : ''}</div>`
    : '';

  const cloRows = cl.map(clo => {
    const ind  = indirectCloAnalysis?.[clo.id];
    const fS   = clo.finalAttainment?.score ?? clo.statistics.avgDirectLevel ?? 0;
    const fL   = clo.finalAttainment?.level ?? clo.directAttainment.level;
    const indC = hi
      ? `<td>${ind ? ind.indirectAttainment.avgLevel.toFixed(2) : '—'}</td><td style="color:${ind ? lc[ind.indirectAttainment.level] : '#94a3b8'};font-weight:600">${ind ? `L${ind.indirectAttainment.level} ${ind.indirectAttainment.label}` : '—'}</td>`
      : '';
    return `<tr>
      <td><strong>${clo.code}</strong></td><td>${clo.bloomLevel || 'N/A'}</td><td>${clo.threshold}%</td>
      <td>${clo.statistics.attainedStudents}/${clo.statistics.totalStudents}</td>
      <td>${(clo.statistics.avgDirectLevel ?? 0).toFixed(2)}</td>
      <td style="color:${lc[clo.directAttainment.level]};font-weight:600">L${clo.directAttainment.level} ${clo.directAttainment.label}</td>
      ${indC}
      <td><strong>${fS.toFixed(2)}</strong></td>
      <td style="color:${lc[fL]};font-weight:700">L${fL} ${levelLabel(fL)}</td>
    </tr>`;
  }).join('');

  let indSec = '';
  if (hi) {
    indSec = `<h2>Indirect Assessment — Student Ratings</h2>` +
      sortCLOs(Object.values(indirectCloAnalysis)).map(ic => {
        const rows = ic.statistics.studentRatings.slice(0, 60).map(s =>
          `<tr><td>${s.rollNumber}</td><td>${s.name}</td><td>L${s.rating} ${levelLabel(s.rating)}</td></tr>`
        ).join('');
        return `<h4>${ic.code} — avg level: ${ic.indirectAttainment.avgLevel.toFixed(2)} | L${ic.indirectAttainment.level} ${ic.indirectAttainment.label}</h4>
        <p style="font-size:10px;color:#64748b;margin:0 0 6px">${ic.statistics.totalStudents} students · Scale 0–3</p>
        <table><thead><tr><th>Roll No</th><th>Student</th><th>Level</th></tr></thead><tbody>${rows}</tbody></table>`;
      }).join('');
  }

  const cloH  = cl.map(c => `<th colspan="2">${c.code}</th>`).join('');
  const cloS  = cl.map(() => `<th>Score%</th><th>Lvl</th>`).join('');
  const sRows = performanceData.students.slice(0, 100).map(s => {
    const cells = cl.map(clo => {
      const p   = s.cloPerformance[clo.id];
      const pct = p?.averagePercentage ?? p?.percentage ?? 0;
      const lvl = p?.attainmentLevel ?? p?.overallAttainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
      return `<td>${pct.toFixed(1)}%</td><td>L${lvl}</td>`;
    }).join('');
    return `<tr><td>${s.rollNumber}</td><td>${s.name}</td>${cells}<td><strong>${s.totalPercentage.toFixed(1)}%</strong></td></tr>`;
  }).join('');

  return `<!DOCTYPE html><html><head><title>${cc} Course Level Attainment Report</title>
<style>
  body{font-family:Arial,sans-serif;font-size:11px;color:#111;margin:20px}
  h1{font-size:20px;color:#1e40af;margin-bottom:0}
  h2{font-size:16px;color:#1e293b;margin:20px 0 8px;border-bottom:2px solid #e2e8f0;padding-bottom:5px}
  h3{font-size:14px;color:#334155;margin:4px 0 10px}
  h4{font-size:11px;margin:14px 0 4px;color:#374151}
  .meta{font-size:10px;color:#64748b;margin-bottom:5px}
  .faculty-line{font-size:11px;color:#334155;background:#f8fafc;padding:6px 10px;border-radius:4px;margin:8px 0;border-left:4px solid #1e40af}
  .scale{font-size:10px;color:#475569;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;padding:5px 10px;margin:6px 0}
  .sum-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:10px 14px;margin:10px 0}
  .sum-item{display:flex;flex-direction:column;gap:2px}
  .sum-lbl{font-size:9px;color:#6b7280;text-transform:uppercase}
  .sum-val{font-size:14px;font-weight:700}
  .formula{background:#fefce8;border:1px solid #fde68a;border-radius:6px;padding:8px 12px;margin:8px 0;font-size:10px;color:#78350f}
  table{width:100%;border-collapse:collapse;margin-bottom:14px;font-size:10px}
  th{background:#f1f5f9;padding:6px 8px;text-align:left;border:1px solid #e2e8f0;font-weight:600}
  td{padding:5px 8px;border:1px solid #e2e8f0}
  tr:nth-child(even){background:#f8fafc}
  @media print{body{margin:0}.faculty-line{border-left:4px solid #000}}
</style>
</head><body>
<h1>${cc} — ${cn}</h1>
<h3>Course Level Attainment Report</h3>
<div class="meta">Semester: ${semester} &nbsp;|&nbsp; Academic Year: ${year} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
${facultyLine}
<div class="scale">Level Scale: L0=Low (below threshold) · L1=Good (+0–10%) · L2=Very Good (+10–20%) · L3=Excellent (≥+20%) &nbsp;|&nbsp; Formula: 0.8 × Direct + 0.2 × Indirect (when available)</div>
<div class="sum-grid">
  <div class="sum-item"><span class="sum-lbl">Avg Direct Level</span><span class="sum-val">${cD.toFixed(2)}</span></div>
  ${hi ? `<div class="sum-item"><span class="sum-lbl">Avg Indirect Level</span><span class="sum-val">${cI.toFixed(2)}</span></div>` : '<div></div>'}
  <div class="sum-item"><span class="sum-lbl">Final Score</span><span class="sum-val" style="color:${lc[cFL]}">${cF.toFixed(2)} — L${cFL} ${levelLabel(cFL)}</span></div>
</div>
<div class="formula"><strong>Formula:</strong> ${hi ? `0.8 × ${cD.toFixed(2)} (Direct) + 0.2 × ${cI.toFixed(2)} (Indirect) = ${cF.toFixed(2)}` : 'Direct Attainment Only — no indirect data uploaded'}</div>
<h2>CLO Attainment Summary</h2>
<table><thead><tr>
  <th>CLO</th><th>Bloom's</th><th>Threshold</th><th>Attained</th>
  <th>Avg Direct Lvl</th><th>Direct Level</th>
  ${hi ? '<th>Avg Indirect Lvl</th><th>Indirect Level</th>' : ''}
  <th>Final Score</th><th>Final Level</th>
</tr></thead><tbody>${cloRows}</tbody></table>
${indSec}
<h2>Student-wise CLO Performance${performanceData.students.length > 100 ? ' (first 100)' : ''}</h2>
<table><thead>
  <tr><th>Roll No.</th><th>Name</th>${cloH}<th>Overall %</th></tr>
  <tr><th></th><th></th>${cloS}<th></th></tr>
</thead><tbody>${sRows}</tbody></table>
</body></html>`;
};

const downloadBlob = (content, fileName, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ─── Inline style constants ───────────────────────────────────────────────────
const S = {
  wrap:    { fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: '#f8fafc', minHeight: '100vh' },
  content: { maxWidth: 1400, margin: '0 auto', padding: '0 16px 32px' },
  infoBar: {
    display: 'flex', flexWrap: 'wrap', gap: '6px 12px', alignItems: 'center',
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '10px 16px', marginBottom: 10
  },
  infoChip:      { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#374151', fontWeight: 500 },
  infoChipLabel: { color: '#94a3b8', fontWeight: 400 },
  divider:       { width: 1, height: 16, background: '#e2e8f0', flexShrink: 0 },
  scaleBar: {
    display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '8px 14px', marginBottom: 10, fontSize: 12
  },
  sectionCard:   { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, marginBottom: 8, overflow: 'hidden' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer', userSelect: 'none' },
  sectionIcon:   { width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionTitle:  { flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' },
  sectionBody:   { padding: '12px 16px', borderTop: '1px solid #f1f5f9' },
  badge: (lvl) => ({
    display: 'inline-flex', alignItems: 'center', gap: 3,
    padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
    background: levelBg(lvl), color: levelColor(lvl), border: `1px solid ${levelBorder(lvl)}`
  }),
  sectionBadge:        { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' },
  sectionBadgeSuccess: { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' },
  sectionBadgeWarn:    { fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' },
  table:   { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th:      { padding: '7px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', fontWeight: 600, color: '#374151', textAlign: 'left', whiteSpace: 'nowrap' },
  td:      { padding: '7px 10px', border: '1px solid #f1f5f9', color: '#374151', verticalAlign: 'middle' },
  trEven:  { background: '#fafafa' },
  barWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  barTrack:{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill: (pct, lvl) => ({ width: `${Math.min(pct, 100)}%`, height: '100%', background: levelColor(lvl), borderRadius: 3 }),
  formulaChip: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#78350f' },
};

// ─── Section ──────────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, iconColor = '#2563eb', iconBg = '#eff6ff', sectionKey, expanded, onToggle, children, badge, badgeVariant = 'default', stepNum }) => {
  const badgeStyle = badgeVariant === 'success' ? S.sectionBadgeSuccess : badgeVariant === 'warn' ? S.sectionBadgeWarn : S.sectionBadge;
  return (
    <div style={S.sectionCard}>
      <div style={S.sectionHeader} onClick={() => onToggle(sectionKey)}>
        {stepNum && (
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1e293b', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{stepNum}</div>
        )}
        <div style={{ ...S.sectionIcon, background: iconBg }}><Icon size={15} color={iconColor} /></div>
        <span style={S.sectionTitle}>{title}</span>
        {badge && <span style={badgeStyle}>{badge}</span>}
        <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>
      </div>
      {expanded && <div style={S.sectionBody}>{children}</div>}
    </div>
  );
};

const LevelBadge = ({ level }) => <span style={S.badge(level)}>L{level} {levelLabel(level)}</span>;

// ─── Assessment Details Table ─────────────────────────────────────────────────
const AssessmentDetailsTable = ({ isAllMode, performanceData }) => {
  if (!isAllMode) {
    const a = performanceData.assessment;
    if (!a) return null;
    return (
      <table style={S.table}>
        <thead><tr>{['Title','Type','Max Marks','Duration','Conducted On','CLOs Covered'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
        <tbody>
          <tr>
            <td style={S.td}><strong>{a.title || '—'}</strong></td>
            <td style={S.td}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 600 }}>{a.type || '—'}</span></td>
            <td style={S.td}>{a.maxMarks ?? '—'}</td>
            <td style={S.td}>{a.duration ? `${a.duration} min` : '—'}</td>
            <td style={S.td}>{a.conductedOn ? new Date(a.conductedOn).toLocaleDateString() : '—'}</td>
            <td style={S.td}>{performanceData.clos?.length ?? 0}</td>
          </tr>
        </tbody>
      </table>
    );
  }

  const assessments = performanceData.assessments || [];
  const stats       = performanceData.assessmentWiseStats || [];
  const clos        = sortCLOs(performanceData.clos || []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Finalized Assessments</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={S.table}>
            <thead><tr>{['#','Title','Type','Max Marks','CLOs'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
            <tbody>
              {assessments.map((a, i) => {
                const st = stats[i];
                return (
                  <tr key={a.id} style={i % 2 === 0 ? {} : S.trEven}>
                    <td style={{ ...S.td, color: '#94a3b8', fontWeight: 700, width: 30 }}>{i + 1}</td>
                    <td style={S.td}><strong>{a.title}</strong></td>
                    <td style={S.td}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 600 }}>{a.type || '—'}</span></td>
                    <td style={S.td}>{a.maxMarks ?? '—'}</td>
                   
                    <td style={S.td}>{st?.clos?.length ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {clos.length > 0 && assessments.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>CLO Coverage Across Assessments</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ ...S.table, fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...S.th, minWidth: 80 }}>CLO</th>
                  <th style={{ ...S.th, minWidth: 180 }}>Statement</th>
                  {assessments.map((a, i) => (
                    <th key={a.id} style={{ ...S.th, textAlign: 'center', minWidth: 70 }}>
                      <div style={{ fontSize: 10, color: '#64748b' }}>A{i + 1}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.title}>{a.title}</div>
                    </th>
                  ))}
                  <th style={{ ...S.th, textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo, ci) => {
                  const coverageCount = stats.filter(st => st.clos?.some(c => c.id === clo.id)).length;
                  return (
                    <tr key={clo.id} style={ci % 2 === 0 ? {} : S.trEven}>
                      <td style={{ ...S.td, fontWeight: 700, color: '#1e293b' }}>{clo.code}</td>
                      <td style={{ ...S.td, color: '#64748b', maxWidth: 200 }}>{clo.statement?.substring(0, 60)}{clo.statement?.length > 60 ? '…' : ''}</td>
                      {assessments.map((a, ai) => {
                        const covered = stats[ai]?.clos?.some(c => c.id === clo.id);
                        const marks   = stats[ai]?.clos?.find(c => c.id === clo.id)?.maxMarks;
                        return (
                          <td key={a.id} style={{ ...S.td, textAlign: 'center' }}>
                            {covered
                              ? <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                  <CheckCircle size={14} color="#16a34a" />
                                  {marks !== undefined && <span style={{ fontSize: 9, color: '#64748b' }}>{marks}m</span>}
                                </span>
                              : <span style={{ color: '#e2e8f0' }}>—</span>}
                          </td>
                        );
                      })}
                      <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: coverageCount > 0 ? '#2563eb' : '#94a3b8' }}>
                        {coverageCount}/{assessments.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Indirect Upload Panel ────────────────────────────────────────────────────
const XLSX_COLS_ARR = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const IndirectUploadPanel = ({ course, closData, semester, year, onUploaded }) => {
  const [file, setFile]           = useState(null);
  const [rows, setRows]           = useState([]);
  const [cols, setCols]           = useState([]);
  const [rollCol, setRollCol]     = useState('');
  const [cloMap, setCloMap]       = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const fileRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f); setError('');
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb   = XLSX.read(evt.target.result, { type: 'binary' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!json.length) { setError('Empty file'); return; }
      const detCols = json[0].map((h, i) => ({
        letter: XLSX_COLS_ARR[i] || `C${i}`,
        label:  h ? `${XLSX_COLS_ARR[i] || i} — ${h}` : XLSX_COLS_ARR[i] || `Col ${i}`
      }));
      setCols(detCols);
      setRows(
        json.slice(1)
          .map(row => { const obj = {}; detCols.forEach((c, i) => { obj[c.letter] = row[i] !== undefined ? String(row[i]) : ''; }); return obj; })
          .filter(r => Object.values(r).some(v => v.trim()))
      );
    };
    reader.readAsBinaryString(f);
  };

  const canSubmit = file && rollCol && Object.keys(cloMap).length > 0 && Object.values(cloMap).every(v => v);

  const handleImport = async () => {
    if (!canSubmit) return;
    setUploading(true); setError('');
    try {
      const active  = Object.entries(cloMap).filter(([, col]) => col && col !== 'skip');
      const cleaned = rows
        .filter(row => row[rollCol]?.toString().trim().length > 0)
        .map(row => {
          const out = { ...row };
          active.forEach(([, col]) => {
            let raw = out[col]?.toString().trim() || '';
            if (raw.toLowerCase().includes('option')) { const m = raw.match(/option\s*(\d)/i); raw = m ? m[1] : raw; }
            const n = parseInt(raw, 10);
            out[col] = String(isNaN(n) || n < 0 ? 0 : Math.min(3, n));
          });
          return out;
        })
        .filter(row => active.every(([, col]) => { const n = parseInt(row[col], 10); return !isNaN(n) && n >= 0 && n <= 3; }));
      if (!cleaned.length) { setError('No valid rows found (ratings must be 0–3).'); setUploading(false); return; }
      await facultyApi.importIndirectAssessments(course.id, {
        year: year || course.year, semester: semester || course.semester,
        mappings: { rollNoColumn: rollCol, cloColumns: cloMap }, data: cleaned
      });
      await onUploaded();
    } catch (err) { setError(err.response?.data?.message || 'Import failed.'); }
    finally { setUploading(false); }
  };

  if (!file) return (
    <div onClick={() => fileRef.current?.click()}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 24px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: 10, cursor: 'pointer' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Upload size={22} color="#2563eb" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1e293b', fontSize: 13 }}>Upload Student Feedback (Excel / CSV)</p>
        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Ratings on <strong>0–3 scale</strong> only</p>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {LEVEL_LABELS.map((lbl, i) => <span key={i} style={{ ...S.badge(i), fontSize: 11 }}>{i} = {lbl}</span>)}
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#f97316', fontWeight: 500 }}>⚠ Values &gt; 3 auto-capped to 3</p>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  );

  // File selected view — CLOs sorted, grid layout prevents overflow
  const sortedClos = sortCLOs(closData);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        <span style={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>📄 {file.name}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{rows.length} rows detected</span>
        <button onClick={() => { setFile(null); setRows([]); setRollCol(''); setCloMap({}); }}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 6, padding: '3px 10px', fontSize: 12, cursor: 'pointer' }}>
          <X size={13} /> Clear
        </button>
      </div>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Scale */}
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '7px 12px', fontSize: 11, color: '#92400e' }}>
          <strong>Scale: 0–3 only.</strong> &nbsp;0=Low · 1=Good · 2=Very Good · 3=Excellent. Values &gt;3 are capped to 3.
        </div>

        {/* Roll number column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            Roll Number Column <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <select value={rollCol} onChange={e => setRollCol(e.target.value)}
            style={{ width: '100%', maxWidth: 280, padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, background: '#fff', display: 'block' }}>
            <option value="">— Select column —</option>
            {cols.map(c => <option key={c.letter} value={c.letter}>{c.label}</option>)}
          </select>
        </div>

        {/* CLO mapping — each row: code+statement on LEFT, select on RIGHT, no overflow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Map Excel Columns → CLOs (0–3 ratings)
          </div>
          {sortedClos.map(clo => (
            <div key={clo.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                border: '1px solid #f1f5f9',
                borderRadius: 8,
                background: (cloMap[clo.code] && cloMap[clo.code] !== 'skip') ? '#f0fdf4' : '#fafafa'
              }}>
              {/* Left: CLO info — takes available space, min-width 0 so it shrinks */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{clo.code}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clo.statement?.substring(0, 55)}{clo.statement?.length > 55 ? '…' : ''}
                </div>
              </div>
              {/* Right: select — fixed width, never grows */}
              <div style={{ flexShrink: 0, width: 190 }}>
                <select
                  value={cloMap[clo.code] || ''}
                  onChange={e => setCloMap(p => ({ ...p, [clo.code]: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 12, background: '#fff' }}>
                  <option value="">— Select column —</option>
                  <option value="skip">Skip this CLO</option>
                  {cols.map(c => <option key={c.letter} value={c.letter}>{c.label}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        {rollCol && rows.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>Preview — first 3 rows (values &gt;3 will be capped)</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ ...S.table, fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={S.th}>Roll No</th>
                    {Object.entries(cloMap).filter(([, v]) => v && v !== 'skip').map(([code, col]) => (
                      <th key={code} style={S.th}>{code} ({col})</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 3).map((row, i) => (
                    <tr key={i} style={i % 2 === 0 ? {} : S.trEven}>
                      <td style={S.td}>{row[rollCol]}</td>
                      {Object.entries(cloMap).filter(([, v]) => v && v !== 'skip').map(([code, col]) => {
                        const raw = row[col]; const n = parseInt(raw, 10);
                        const capped  = isNaN(n) ? raw : Math.min(3, Math.max(0, n));
                        const changed = !isNaN(n) && n > 3;
                        return <td key={code} style={{ ...S.td, color: changed ? '#f97316' : '#1e293b' }}>{capped}{changed ? ` (was ${n})` : ''}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '7px 10px' }}>
            <AlertTriangle size={13} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleImport} disabled={!canSubmit || uploading}
            style={{ background: canSubmit ? '#1d4ed8' : '#93c5fd', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            {uploading ? 'Importing…' : `Import ${rows.filter(r => r[rollCol]?.toString().trim()).length} rows`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Indirect Data View ───────────────────────────────────────────────────────
const IndirectDataView = ({ indirectData, indirectCloAnalysis }) => {
  const [expanded, setExpanded] = useState(null);
  if (!indirectCloAnalysis) return null;
  const clos = sortCLOs(Object.values(indirectCloAnalysis));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '8px 12px' }}>
        <CheckCircle size={14} color="#16a34a" />
        <span style={{ fontSize: 12, color: '#15803d', fontWeight: 500 }}>
          {new Set(indirectData.map(e => e.student?.rollNumber)).size} students ·{' '}
          {new Set(indirectData.map(e => e.cloId)).size} CLOs · {indirectData.length} ratings · Scale 0–3
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>{['CLO',"Bloom's",'Students','Avg Level','Level','Distribution'].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {clos.map((ic, i) => (
              <tr key={ic.id} style={i % 2 === 0 ? {} : S.trEven}>
                <td style={S.td}><strong>{ic.code}</strong></td>
                <td style={S.td}>{ic.bloomLevel ? <span style={{ padding: '2px 7px', borderRadius: 8, background: '#ede9fe', color: '#6d28d9', fontSize: 10, fontWeight: 600 }}>{ic.bloomLevel}</span> : '—'}</td>
                <td style={S.td}>{ic.statistics.totalStudents}</td>
                <td style={{ ...S.td, fontWeight: 700 }}>{ic.indirectAttainment.avgLevel.toFixed(2)}</td>
                <td style={S.td}><LevelBadge level={ic.indirectAttainment.level} /></td>
                <td style={{ ...S.td, minWidth: 160 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2,3].map(lvl => {
                      const cnt = ic.statistics.distribution[lvl] || 0;
                      const pct = ic.statistics.totalStudents > 0 ? (cnt / ic.statistics.totalStudents) * 100 : 0;
                      return (
                        <div key={lvl} style={{ flex: 1, textAlign: 'center' }}>
                          <div style={{ height: 20, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden', marginBottom: 2, position: 'relative' }}>
                            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${pct}%`, background: levelColor(lvl) }} />
                          </div>
                          <div style={{ fontSize: 9, color: levelColor(lvl), fontWeight: 700 }}>L{lvl}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8' }}>{cnt}</div>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {clos.map(ic => (
        <div key={ic.id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
          <div onClick={() => setExpanded(expanded === ic.id ? null : ic.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', background: '#fafafa' }}>
            <strong style={{ fontSize: 12, color: '#1e293b' }}>{ic.code}</strong>
            <span style={{ flex: 1, fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ic.statement?.substring(0, 70)}…</span>
            <LevelBadge level={ic.indirectAttainment.level} />
            {expanded === ic.id ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
          </div>
          {expanded === ic.id && (
            <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                <table style={{ ...S.table, fontSize: 11 }}>
                  <thead><tr>{['Roll No.','Student','Rating (0-3)','Level'].map(h => <th key={h} style={{ ...S.th, position: 'sticky', top: 0 }}>{h}</th>)}</tr></thead>
                  <tbody>
                    {ic.statistics.studentRatings.map((s, i) => (
                      <tr key={i} style={i % 2 === 0 ? {} : S.trEven}>
                        <td style={S.td}>{s.rollNumber}</td>
                        <td style={S.td}>{s.name}</td>
                        <td style={{ ...S.td, textAlign: 'center', fontWeight: 700, color: levelColor(s.rating) }}>{s.rating}</td>
                        <td style={S.td}><LevelBadge level={s.level} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Attainment Summary ───────────────────────────────────────────────────────
const AttainmentSummary = ({ cloList, hasIndirectData }) => {
  const sorted = sortCLOs(cloList);
  const cD  = sorted.length ? sorted.reduce((s, c) => s + (c.statistics.avgDirectLevel ?? 0), 0) / sorted.length : 0;
  const cwi = sorted.filter(c => c.indirectAttainment);
  const cI  = cwi.length ? cwi.reduce((s, c) => s + c.indirectAttainment.avgLevel, 0) / cwi.length : null;
  const cF  = hasIndirectData && cI !== null ? 0.8 * cD + 0.2 * cI : cD;
  const cFL = Math.min(3, Math.round(cF));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>CLO</th><th style={S.th}>Bloom's</th><th style={S.th}>Threshold</th>
              <th style={S.th}>Attained</th><th style={S.th}>Avg Direct Lvl</th><th style={S.th}>Direct (80%)</th>
              {hasIndirectData && <><th style={S.th}>Avg Indirect Lvl</th><th style={S.th}>Indirect (20%)</th></>}
              <th style={S.th}>Final Score</th><th style={S.th}>{hasIndirectData ? 'Final Level' : 'Level'}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((clo, i) => {
              const fS  = clo.finalAttainment?.score ?? clo.statistics.avgDirectLevel ?? 0;
              const fL  = clo.finalAttainment?.level ?? clo.directAttainment.level;
              const ind = clo.indirectAttainment;
              return (
                <tr key={clo.id} style={i % 2 === 0 ? {} : S.trEven}>
                  <td style={{ ...S.td, fontWeight: 700, color: '#1e293b' }}>{clo.code}</td>
                  <td style={S.td}>{clo.bloomLevel || '—'}</td>
                  <td style={S.td}>{clo.threshold}%</td>
                  <td style={S.td}><span style={{ fontWeight: 600 }}>{clo.statistics.attainedStudents}</span><span style={{ color: '#94a3b8' }}>/{clo.statistics.totalStudents}</span></td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{(clo.statistics.avgDirectLevel ?? 0).toFixed(2)}</td>
                  <td style={S.td}><LevelBadge level={clo.directAttainment.level} /></td>
                  {hasIndirectData && <td style={{ ...S.td, fontWeight: 600 }}>{ind ? ind.avgLevel.toFixed(2) : '—'}</td>}
                  {hasIndirectData && <td style={S.td}>{ind ? <LevelBadge level={ind.level} /> : <span style={{ color: '#94a3b8', fontSize: 11 }}>N/A</span>}</td>}
                  <td style={{ ...S.td, fontWeight: 700 }}>{fS.toFixed(2)}</td>
                  <td style={S.td}><LevelBadge level={fL} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bar chart */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Final Attainment per CLO {hasIndirectData ? '(0.8×Direct + 0.2×Indirect)' : '(Direct only)'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {sorted.map(clo => {
            const fS = clo.finalAttainment?.score ?? clo.statistics.avgDirectLevel ?? 0;
            const fL = clo.finalAttainment?.level ?? clo.directAttainment.level;
            return (
              <div key={clo.id} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 100px', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{clo.code}</span>
                <div style={{ height: 18, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${(Math.min(fS, 3) / 3) * 100}%`, height: '100%', background: levelColor(fL), borderRadius: 4, transition: 'width 0.5s', display: 'flex', alignItems: 'center', paddingLeft: 6 }}>
                    {fS > 0.5 && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>{fS.toFixed(2)}</span>}
                  </div>
                </div>
                <LevelBadge level={fL} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Course-level card */}
      <div style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)', border: `2px solid ${levelBorder(cFL)}`, borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}> Final Attainment</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Avg Direct</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{cD.toFixed(2)}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>× 80%</div>
              </div>
              {hasIndirectData && cI !== null && (
                <>
                  <div style={{ fontSize: 18, color: '#94a3b8', fontWeight: 300 }}>+</div>
                  <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Avg Indirect</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b' }}>{cI.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>× 20%</div>
                  </div>
                </>
              )}
              <div style={{ fontSize: 18, color: '#94a3b8', fontWeight: 300 }}>=</div>
              <div style={{ textAlign: 'center', padding: '10px 18px', borderRadius: 10, background: levelBg(cFL), border: `2px solid ${levelBorder(cFL)}` }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: levelColor(cFL), lineHeight: 1 }}>{cF.toFixed(2)}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: levelColor(cFL), marginTop: 2 }}>L{cFL} — {levelLabel(cFL)}</div>
              </div>
            </div>
          </div>
          <div style={{ minWidth: 220, flex: 1 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>Score on 0–3 scale</div>
            <div style={{ position: 'relative', height: 12, background: '#e2e8f0', borderRadius: 6, marginBottom: 20 }}>
              {[1, 2, 3].map(t => (
                <div key={t} style={{ position: 'absolute', left: `${(t / 3) * 100}%`, top: -3, display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateX(-50%)' }}>
                  <div style={{ width: 2, height: 18, background: '#cbd5e1' }} />
                  <span style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>L{t}</span>
                </div>
              ))}
              <div style={{ width: `${(Math.min(cF, 3) / 3) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${levelColor(0)}, ${levelColor(cFL)})`, borderRadius: 6, transition: 'width 0.6s' }} />
              <div style={{ position: 'absolute', left: `${(Math.min(cF, 3) / 3) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 18, height: 18, borderRadius: '50%', background: levelColor(cFL), border: '3px solid #fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {LEVEL_LABELS.map((lbl, i) => (
                <span key={i} style={{ fontSize: 10, fontWeight: cFL === i ? 700 : 400, color: cFL === i ? levelColor(i) : '#94a3b8' }}>L{i}</span>
              ))}
            </div>
            {hasIndirectData && cI !== null && (
              <div style={{ ...S.formulaChip, marginTop: 8, display: 'inline-flex' }}>
                0.8 × {cD.toFixed(2)} + 0.2 × {cI.toFixed(2)} = {cF.toFixed(2)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Section 2: Quick Glance Dashboard (inline) ───────────────────────────────
const QuickGlanceDashboard = ({ cloList }) => {
  const sorted = sortCLOs(cloList);
  // Compute course-level avg
  const overallScore = sorted.length
    ? sorted.reduce((s, c) => s + (c.finalAttainment?.score ?? c.statistics.avgDirectLevel ?? 0), 0) / sorted.length
    : 0;
  const overallLevel = Math.min(3, Math.round(overallScore));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Top stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
        {[
          { label: 'Total CLOs',  value: sorted.length, color: '#2563eb', bg: '#eff6ff', bdr: '#bfdbfe' },
          { label: 'L3 Excellent', value: sorted.filter(c => (c.finalAttainment?.level ?? c.directAttainment.level) === 3).length, color: '#16a34a', bg: '#f0fdf4', bdr: '#bbf7d0' },
          { label: 'L2 Very Good', value: sorted.filter(c => (c.finalAttainment?.level ?? c.directAttainment.level) === 2).length, color: '#2563eb', bg: '#eff6ff', bdr: '#bfdbfe' },
          { label: 'L1 Good',      value: sorted.filter(c => (c.finalAttainment?.level ?? c.directAttainment.level) === 1).length, color: '#ea580c', bg: '#fff7ed', bdr: '#fed7aa' },
          { label: 'L0 Low',       value: sorted.filter(c => (c.finalAttainment?.level ?? c.directAttainment.level) === 0).length, color: '#dc2626', bg: '#fef2f2', bdr: '#fecaca' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.bdr}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 3, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CLO cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {sorted.map(clo => {
          const fS  = clo.finalAttainment?.score ?? clo.statistics.avgDirectLevel ?? 0;
          const fL  = clo.finalAttainment?.level ?? clo.directAttainment.level;
          const pct = (Math.min(fS, 3) / 3) * 100;
          const att = clo.statistics.attainedStudents ?? 0;
          const tot = clo.statistics.totalStudents ?? 0;
          return (
            <div key={clo.id} style={{
              background: '#fff', border: `1px solid ${levelBorder(fL)}`,
              borderLeft: `3px solid ${levelColor(fL)}`,
              borderRadius: 10, padding: '10px 12px',
              display: 'flex', flexDirection: 'column', gap: 7
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{clo.code}</span>
                <LevelBadge level={fL} />
              </div>
              {clo.bloomLevel && (
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: '#ede9fe', color: '#6d28d9', fontWeight: 600, alignSelf: 'flex-start' }}>{clo.bloomLevel}</span>
              )}
              {/* Progress bar */}
              <div>
                <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: levelColor(fL), borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                  <span style={{ fontSize: 10, color: '#64748b' }}>Score {fS.toFixed(2)}/3</span>
                  <span style={{ fontSize: 10, color: '#64748b' }}>{att}/{tot} attained</span>
                </div>
              </div>
              {/* Direct vs indirect mini row */}
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ flex: 1, background: '#f8fafc', borderRadius: 6, padding: '4px 7px', fontSize: 10 }}>
                  <div style={{ color: '#94a3b8', marginBottom: 1 }}>Direct</div>
                  <div style={{ fontWeight: 700, color: levelColor(clo.directAttainment.level) }}>
                    L{clo.directAttainment.level} · {(clo.statistics.avgDirectLevel ?? 0).toFixed(2)}
                  </div>
                </div>
                {clo.indirectAttainment && (
                  <div style={{ flex: 1, background: '#f8fafc', borderRadius: 6, padding: '4px 7px', fontSize: 10 }}>
                    <div style={{ color: '#94a3b8', marginBottom: 1 }}>Indirect</div>
                    <div style={{ fontWeight: 700, color: levelColor(clo.indirectAttainment.level) }}>
                      L{clo.indirectAttainment.level} · {clo.indirectAttainment.avgLevel.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Course avg final score mini gauge row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: levelBg(overallLevel), border: `1px solid ${levelBorder(overallLevel)}`, borderRadius: 10, padding: '10px 16px' }}>
        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>Course Avg:</div>
        <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div style={{ width: `${(overallScore / 3) * 100}%`, height: '100%', background: levelColor(overallLevel), borderRadius: 4, transition: 'width 0.6s' }} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 800, color: levelColor(overallLevel), whiteSpace: 'nowrap' }}>
          {overallScore.toFixed(2)} &nbsp;<LevelBadge level={overallLevel} />
        </div>
      </div>
    </div>
  );
};

// ─── Section 3: CLO-wise Attainment Analysis (inline) ─────────────────────────
const CLOAnalysisSection = ({ cloList, calculateAttainmentLevel: _calcLevel }) => {
  const [expandedClo, setExpandedClo] = useState(null);
  const sorted = sortCLOs(cloList);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((clo, ci) => {
        const fS       = clo.finalAttainment?.score ?? clo.statistics.avgDirectLevel ?? 0;
        const fL       = clo.finalAttainment?.level ?? clo.directAttainment.level;
        const dist     = clo.statistics.attainmentDistribution || {};
        const tot      = clo.statistics.totalStudents || 1;
        const isOpen   = expandedClo === clo.id;
        const scores   = Array.isArray(clo.studentScores)
          ? clo.studentScores
          : Object.values(clo.studentScores || {});

        return (
          <div key={clo.id} style={{ border: `1px solid ${isOpen ? levelBorder(fL) : '#e2e8f0'}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
            {/* Row header — click to expand */}
            <div
              onClick={() => setExpandedClo(isOpen ? null : clo.id)}
              style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto auto auto auto', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', background: isOpen ? levelBg(fL) : (ci % 2 === 0 ? '#fff' : '#fafafa') }}
            >
              {/* Code */}
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1e293b' }}>{clo.code}</span>

              {/* Statement + bloom */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clo.statement?.substring(0, 80)}{clo.statement?.length > 80 ? '…' : ''}
                </div>
                {clo.bloomLevel && (
                  <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 5, background: '#ede9fe', color: '#6d28d9', fontWeight: 600 }}>{clo.bloomLevel}</span>
                )}
              </div>

              {/* Mini distribution bar */}
              <div style={{ width: 80, display: 'flex', gap: 2 }}>
                {[0,1,2,3].map(lvl => {
                  const cnt = dist[`level${lvl}`] ?? 0;
                  const h   = tot > 0 ? Math.max(3, (cnt / tot) * 32) : 3;
                  return (
                    <div key={lvl} style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                      <div style={{ width: '100%', height: h, background: levelColor(lvl), borderRadius: '2px 2px 0 0', opacity: 0.85 }} title={`L${lvl}: ${cnt}`} />
                    </div>
                  );
                })}
              </div>

              {/* Attained count */}
              <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>
                <strong style={{ color: '#1e293b' }}>{clo.statistics.attainedStudents}</strong>/{clo.statistics.totalStudents}
              </span>

              {/* Final level badge */}
              <LevelBadge level={fL} />

              {/* Chevron */}
              <div style={{ color: '#94a3b8' }}>{isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</div>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{ borderTop: `1px solid ${levelBorder(fL)}`, padding: '12px 14px', background: '#fff' }}>
                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, marginBottom: 12 }}>
                  {[
                    { label: 'Threshold', value: `${clo.threshold}%`, color: '#374151' },
                    { label: 'Max Marks', value: clo.maxMarks ?? '—', color: '#374151' },
                    { label: 'Class Attainment', value: `${(clo.statistics.classAttainment ?? 0).toFixed(1)}%`, color: levelColor(fL) },
                    { label: 'Avg Score', value: `${(clo.statistics.averageScore ?? 0).toFixed(1)}%`, color: '#374151' },
                    { label: 'Avg Direct Lvl', value: (clo.statistics.avgDirectLevel ?? 0).toFixed(2), color: levelColor(clo.directAttainment.level) },
                    ...(clo.indirectAttainment ? [{ label: 'Avg Indirect Lvl', value: clo.indirectAttainment.avgLevel.toFixed(2), color: levelColor(clo.indirectAttainment.level) }] : []),
                    { label: 'Final Score', value: fS.toFixed(2), color: levelColor(fL) },
                  ].map(st => (
                    <div key={st.label} style={{ background: '#f8fafc', borderRadius: 7, padding: '7px 10px' }}>
                      <div style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{st.label}</div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: st.color }}>{st.value}</div>
                    </div>
                  ))}
                </div>

                {/* Distribution bars */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Student Distribution</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[0,1,2,3].map(lvl => {
                      const cnt = dist[`level${lvl}`] ?? 0;
                      const pct = tot > 0 ? (cnt / tot) * 100 : 0;
                      return (
                        <div key={lvl} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 50px', alignItems: 'center', gap: 8 }}>
                          <LevelBadge level={lvl} />
                          <div style={{ height: 10, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: levelColor(lvl), borderRadius: 3, transition: 'width 0.4s' }} />
                          </div>
                          <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{cnt} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Student scores table (top 15) */}
                {scores.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                      Student Scores {scores.length > 15 ? `(top 15 of ${scores.length})` : ''}
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: 200, overflowY: 'auto' }}>
                      <table style={{ ...S.table, fontSize: 11 }}>
                        <thead>
                          <tr>
                            {['Roll No.', 'Student', 'Score %', 'Level'].map(h => (
                              <th key={h} style={{ ...S.th, position: 'sticky', top: 0, zIndex: 1 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scores.slice(0, 15).map((s, i) => {
                            const pct = s.averagePercentage ?? s.percentage ?? 0;
                            const lvl = s.overallAttainmentLevel ?? s.attainmentLevel ?? 0;
                            return (
                              <tr key={i} style={i % 2 === 0 ? {} : S.trEven}>
                                <td style={S.td}>{s.rollNumber}</td>
                                <td style={S.td}>{s.name}</td>
                                <td style={{ ...S.td }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <div style={{ width: 50, height: 5, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
                                      <div style={{ width: `${pct}%`, height: '100%', background: levelColor(lvl), borderRadius: 3 }} />
                                    </div>
                                    <span style={{ fontWeight: 600, color: levelColor(lvl) }}>{pct.toFixed(1)}%</span>
                                  </div>
                                </td>
                                <td style={S.td}><LevelBadge level={lvl} /></td>
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
        );
      })}
    </div>
  );
};

// ─── Section 4: Student Performance Table (inline) ────────────────────────────
const StudentPerformanceTable = ({ performanceData, cloList, isAllMode, calculateAttainmentLevel: _calcLevel }) => {
  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState('rollNumber');
  const [sortAsc, setSortAsc] = useState(true);
  const sorted   = sortCLOs(cloList);
  const students = performanceData.students || [];

  const filtered = students.filter(s =>
    s.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase())
  );
  const sortedStudents = [...filtered].sort((a, b) => {
    let va = a[sortKey] ?? 0, vb = b[sortKey] ?? 0;
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortAsc ? -1 : 1;
    if (va > vb) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (key) => { if (sortKey === key) setSortAsc(a => !a); else { setSortKey(key); setSortAsc(true); } };
  const SortIcon = ({ k }) => sortKey === k ? (sortAsc ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by roll no. or name…"
          style={{ flex: 1, minWidth: 200, maxWidth: 320, padding: '7px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff' }}
        />
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{sortedStudents.length} of {students.length} students</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0' }}>
        <table style={{ ...S.table, fontSize: 11 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th onClick={() => toggleSort('rollNumber')} style={{ ...S.th, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Roll No.<SortIcon k="rollNumber" />
              </th>
              <th onClick={() => toggleSort('name')} style={{ ...S.th, cursor: 'pointer', minWidth: 130 }}>
                Name<SortIcon k="name" />
              </th>
              {sorted.map(clo => (
                <th key={clo.id} style={{ ...S.th, textAlign: 'center', minWidth: 80 }}>
                  <div style={{ fontSize: 10, fontWeight: 700 }}>{clo.code}</div>
                  <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 400 }}>thr {clo.threshold}%</div>
                </th>
              ))}
              <th onClick={() => toggleSort('totalPercentage')} style={{ ...S.th, textAlign: 'center', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Overall %<SortIcon k="totalPercentage" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.slice(0, 100).map((s, si) => {
              const overallPct = s.totalPercentage ?? 0;
              const overallLvl = calculateAttainmentLevel(overallPct, 50);
              return (
                <tr key={s.studentId || si} style={si % 2 === 0 ? { background: '#fff' } : S.trEven}>
                  <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 11, color: '#374151' }}>{s.rollNumber}</td>
                  <td style={{ ...S.td, fontWeight: 500, color: '#1e293b', whiteSpace: 'nowrap' }}>{s.name}</td>
                  {sorted.map(clo => {
                    const p   = s.cloPerformance?.[clo.id];
                    const pct = p?.averagePercentage ?? p?.percentage ?? 0;
                    const lvl = p?.attainmentLevel ?? p?.overallAttainmentLevel ?? calculateAttainmentLevel(pct, clo.threshold);
                    const attained = pct >= clo.threshold;
                    return (
                      <td key={clo.id} style={{ ...S.td, textAlign: 'center', background: levelBg(lvl), padding: '5px 4px' }}>
                        <div style={{ fontWeight: 700, fontSize: 11, color: levelColor(lvl) }}>{pct.toFixed(0)}%</div>
                        <div style={{ fontSize: 9, color: levelColor(lvl), opacity: 0.8 }}>L{lvl}</div>
                      </td>
                    );
                  })}
                  <td style={{ ...S.td, textAlign: 'center', background: levelBg(overallLvl), fontWeight: 700, color: levelColor(overallLvl) }}>
                    {overallPct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sortedStudents.length > 100 && (
          <div style={{ padding: '8px 14px', fontSize: 11, color: '#94a3b8', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            Showing first 100 of {sortedStudents.length} students
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const StudentPerformanceAnalysis = ({
  course, assessmentId = null, onClose, standalone = true, showHeader = true, className = ''
}) => {
  const [selectedAssessment, setSelectedAssessment]     = useState(null);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [performanceData, setPerformanceData]           = useState(null);
  const [loading, setLoading]                           = useState(false);
  const [submitting, setSubmitting]                     = useState(false);
  const [error, setError]                               = useState(null);
  const [successMessage, setSuccessMessage]             = useState('');
  const [analysisMode, setAnalysisMode]                 = useState('all');
  const [isReportSubmitted, setIsReportSubmitted]       = useState(false);
  const [assignedFaculties, setAssignedFaculties]       = useState([]);
  const analysisModeRef         = useRef('all');
  const finalizedAssessmentsRef = useRef([]);

  const [indirectData, setIndirectData]               = useState(null);
  const [indirectCloAnalysis, setIndirectCloAnalysis] = useState(null);
  const [indirectLoading, setIndirectLoading]         = useState(false);
  const [closData, setClosData]                       = useState([]);
  const [cloListWithFinal, setCloListWithFinal]       = useState([]);

  // All independently expandable — no single-open restriction
  const [expandedSections, setExpandedSections] = useState({
    assessmentDetails:  true,
    quickGlance:        true,
    cloWiseAnalysis:    false,
    studentPerformance: false,
    indirectAssessment: false,
    attainmentSummary:  true,
  });

  const setMode       = m => { analysisModeRef.current = m; setAnalysisMode(m); };
  const toggleSection = k => setExpandedSections(p => ({ ...p, [k]: !p[k] }));

  const loadIndirectData = useCallback(async (sem, yr) => {
    if (!course?.id) return;
    setIndirectLoading(true);
    try {
      const res       = await facultyApi.getIndirectAssessments(course.id, { semester: sem || course.semester, year: yr || course.year });
      const unwrapped = getResponseData(res);
      const raw       = (Array.isArray(unwrapped?.rawData) && unwrapped.rawData)
        || (Array.isArray(unwrapped?.data?.rawData) && unwrapped.data.rawData)
        || (Array.isArray(unwrapped) && unwrapped)
        || null;
      setIndirectData(raw?.length > 0 ? raw : null);
    } catch { setIndirectData(null); }
    finally { setIndirectLoading(false); }
  }, [course]);

  useEffect(() => {
    if (!performanceData) { setCloListWithFinal([]); return; }
    const merged = computeFinalAttainment(Object.values(performanceData.cloAnalysis), indirectCloAnalysis);
    setCloListWithFinal(sortCLOs(merged));
  }, [performanceData, indirectCloAnalysis]);

  useEffect(() => {
    if (Array.isArray(indirectData) && indirectData.length > 0 && closData.length > 0)
      setIndirectCloAnalysis(analyzeIndirectAssessment(indirectData, closData));
    else setIndirectCloAnalysis(null);
  }, [indirectData, closData]);

  const checkReportSubmissionStatus = useCallback(async () => {
    if (!performanceData || analysisModeRef.current !== 'all') return;
    try {
      const ids    = performanceData.assessments?.map(a => a.id) || [];
      const params = new URLSearchParams({ courseId: performanceData.course.id, semester: performanceData.course.semester, year: performanceData.course.year });
      if (ids.length) params.append('assessmentIds', ids.join(','));
      const r = await facultyApi.checkReportSubmission(params);
      setIsReportSubmitted(r.data.isSubmitted);
    } catch { setIsReportSubmitted(false); }
  }, [performanceData]);

  const fetchMarks = useCallback(async (id, sd, cl) => {
    const d = getResponseData(await assessmentApi.getAssessmentMarks(id));
    if (!d) throw new Error('No marks data');
    return analyzeCLOPerformance(d, sd, cl, course);
  }, [course]);

  const fetchAllMarks = useCallback(async (fin, sd, cl) => {
    const results  = await Promise.all(fin.map(a => assessmentApi.getAssessmentMarks(a.id).then(r => getResponseData(r)).catch(() => null)));
    const valid    = results.filter(d => d && d.students);
    const validFin = fin.filter((_, i) => results[i] && results[i].students);
    if (!valid.length) throw new Error('No valid marks data');
    return combineCLOPerformance(valid, sd, cl, course, validFin);
  }, [course]);

  const fetchAllData = useCallback(async () => {
    if (!course) { setError('Please select a course'); return; }
    try {
      setLoading(true); setError(null); setIsReportSubmitted(false);
      const [aRes, sRes, cRes, faculties] = await Promise.all([
        assessmentApi.getCourseAssessments(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseStudents(course.id,    { semester: course.semester, year: course.year }),
        assessmentApi.getCourseClos(course.id),
        fetchAssignedFaculties(course.id, course.semester, course.year)
      ]);
      const aData = getResponseData(aRes)?.assessments || [];
      const sData = getResponseData(sRes)?.students    || [];
      const cl    = getResponseData(cRes)              || [];
      setClosData(cl);
      setAssignedFaculties(faculties);
      const fin = aData.filter(a => a.isMarksFinalized === true);
      setAvailableAssessments(fin); finalizedAssessmentsRef.current = fin;
      if (!fin.length) { setError('No finalized assessments found'); return; }
      if (assessmentId) {
        const t = fin.find(a => a.id === assessmentId);
        if (t) { setSelectedAssessment(t); setMode('single'); setPerformanceData(await fetchMarks(t.id, sData, cl)); }
        else setError('Assessment not found or not finalized');
      } else {
        setMode('all');
        setPerformanceData(await fetchAllMarks(fin, sData, cl));
        await loadIndirectData(course.semester, course.year);
      }
    } catch (err) { setError(err.response?.data?.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [course, assessmentId, fetchMarks, fetchAllMarks, loadIndirectData]);

  useEffect(() => { if (course) fetchAllData(); }, [course, assessmentId, fetchAllData]);
  useEffect(() => { if (performanceData && analysisMode === 'all') checkReportSubmissionStatus(); }, [performanceData, analysisMode, checkReportSubmissionStatus]);

  const handleAssessmentSelect = async (value) => {
    setIsReportSubmitted(false); setError(null); setPerformanceData(null); setLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        assessmentApi.getCourseStudents(course.id, { semester: course.semester, year: course.year }),
        assessmentApi.getCourseClos(course.id)
      ]);
      const sData = getResponseData(sRes)?.students || [];
      const cl    = getResponseData(cRes)           || [];
      setClosData(cl);
      if (value === 'all') {
        setMode('all'); setPerformanceData(await fetchAllMarks(finalizedAssessmentsRef.current, sData, cl));
        await loadIndirectData(course.semester, course.year);
      } else {
        const t = availableAssessments.find(a => a.id === value);
        if (t) { setSelectedAssessment(t); setMode('single'); setIndirectData(null); setIndirectCloAnalysis(null); setPerformanceData(await fetchMarks(t.id, sData, cl)); }
      }
    } catch { setError('Failed to load assessment data'); }
    finally { setLoading(false); }
  };

  const handleSubmitToHOD = async () => {
    if (!performanceData || analysisModeRef.current !== 'all' || !indirectCloAnalysis) return;
    try {
      setSubmitting(true); setError(null); setSuccessMessage('');
      await facultyApi.submitReportToHOD({
        reportName: `${performanceData.course.code} - CLO Attainment Report (Sem ${performanceData.course.semester} ${performanceData.course.year})`,
        reportType: 'COMBINED',
        academicYear: `${performanceData.course.year}-${(performanceData.course.year + 1).toString().slice(-2)}`,
        reportParameters: buildHODPayload(performanceData, cloListWithFinal, indirectCloAnalysis)
      });
      setIsReportSubmitted(true); setSuccessMessage('Report submitted to HOD successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) { setError(err.response?.data?.message || 'Failed to submit'); }
    finally { setSubmitting(false); }
  };

  const handleExportPDF = () => {
    if (!performanceData) return;
    const html = buildPDFHTML(performanceData, cloListWithFinal, indirectCloAnalysis, assignedFaculties);
    const win  = window.open('', '_blank', 'width=1000,height=750');
    if (!win) { alert('Please allow popups for PDF export'); return; }
    win.document.write(html); win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      <div className="loading-state"><div className="spinner" /><p>Loading CLO performance data…</p></div>
    </div>
  );
  if (error && !performanceData) return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      <div className="error-state">
        <AlertTriangle size={48} /><h3>Analysis Unavailable</h3><p>{error}</p>
        {onClose && <button className="btn btn-outline" onClick={onClose}>Close</button>}
      </div>
    </div>
  );
  if (!performanceData) return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`}>
      <div className="empty-state"><Target size={64} /><h3>No CLO Performance Data</h3><p>No finalized assessments found.</p></div>
    </div>
  );

  const isAllMode  = analysisMode === 'all';
  const activeCLOs = cloListWithFinal.length ? cloListWithFinal : sortCLOs(Object.values(performanceData.cloAnalysis));
  // HOD submit is only allowed once indirect data is present + analysis complete, and not already submitted
  const canSubmitToHOD = isAllMode && !!indirectCloAnalysis && !!performanceData && !isReportSubmitted && !submitting;

  return (
    <div className={`performance-analysis ${className} ${standalone ? 'standalone' : ''}`} style={S.wrap}>
      {showHeader && (
        <PerformanceHeader
          isAllMode={isAllMode} performanceData={performanceData}
          availableAssessments={availableAssessments} selectedAssessment={selectedAssessment}
          submitting={submitting} isReportSubmitted={isReportSubmitted} hasIndirectData={!!indirectCloAnalysis}
          canSubmitToHOD={canSubmitToHOD}
          onAssessmentSelect={handleAssessmentSelect} onSubmitToHOD={handleSubmitToHOD}
          onExportPDF={handleExportPDF} onClose={onClose}
          assignedFaculties={assignedFaculties}
        />
      )}

      {!showHeader && isAllMode && (
        <div className="actions-bar-no-header">
          {/* Submit to HOD: only enabled once indirect data is uploaded + analysis done, disabled if already submitted */}
          {(() => {
            const hodLabel = submitting ? 'Submitting...' : isReportSubmitted ? 'Already Submitted' : !indirectCloAnalysis ? 'Upload Indirect First' : 'Submit to HOD';
            return (
              <button
                className={`btn-submit-hod ${isReportSubmitted ? 'btn-submitted' : ''}`}
                onClick={handleSubmitToHOD}
                disabled={!canSubmitToHOD}
                title={!indirectCloAnalysis ? 'Upload indirect assessment data first to enable HOD submission' : isReportSubmitted ? 'Report already submitted' : ''}
              >
                <span>{hodLabel}</span>
                {isReportSubmitted && <CheckCircle size={16} className="submitted-check" />}
              </button>
            );
          })()}
          <button className="btn-export btn-export-pdf" onClick={handleExportPDF}><span>Export PDF</span></button>
        </div>
      )}

      {successMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, color: '#15803d', fontSize: 13, margin: '0 16px 8px' }}>
          <CheckCircle size={16} /><span>{successMessage}</span>
        </div>
      )}
      {error && performanceData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#dc2626', fontSize: 13, margin: '0 16px 8px' }}>
          <AlertTriangle size={16} /><span>{error}</span>
        </div>
      )}

      <div style={S.content}>
        {/* ── Info bar with faculty names ── */}
        <div style={S.infoBar}>
          <div style={S.infoChip}>
            <BookOpen size={14} color="#2563eb" />
            <span style={S.infoChipLabel}>Course</span>
            <strong>{performanceData.course.code}</strong>&nbsp;—&nbsp;{performanceData.course.name}
          </div>
          <div style={S.divider} />
          <div style={S.infoChip}>
            <Users size={14} color="#7c3aed" />
            <span style={S.infoChipLabel}>Students</span>
            <strong>{performanceData.students.length}</strong>
          </div>
          <div style={S.divider} />
          <div style={S.infoChip}>
            <Layers size={14} color="#0891b2" />
            <span style={S.infoChipLabel}>CLOs</span>
            <strong>{activeCLOs.length}</strong>
          </div>
          {isAllMode && (
            <>
              <div style={S.divider} />
              <div style={S.infoChip}>
                <FileText size={14} color="#d97706" />
                <span style={S.infoChipLabel}>Assessments</span>
                <strong>{performanceData.assessments?.length || 0}</strong>
              </div>
              <div style={S.divider} />
              <div style={S.infoChip}>
                <Upload size={14} color={indirectCloAnalysis ? '#16a34a' : '#94a3b8'} />
                <span style={S.infoChipLabel}>Indirect</span>
                <span style={{ color: indirectCloAnalysis ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
                  {indirectLoading ? 'Loading…' : indirectCloAnalysis ? '✓ Loaded' : 'Not uploaded'}
                </span>
              </div>
            </>
          )}
          {!isAllMode && performanceData.assessment && (
            <>
              <div style={S.divider} />
              <div style={S.infoChip}>
                <Star size={14} color="#d97706" />
                <span style={S.infoChipLabel}>Max Marks</span>
                <strong>{performanceData.assessment.maxMarks}</strong>
              </div>
              {performanceData.assessment.duration && (
                <>
                  <div style={S.divider} />
                  <div style={S.infoChip}>
                    <Clock size={14} color="#64748b" />
                    <span style={S.infoChipLabel}>Duration</span>
                    <strong>{performanceData.assessment.duration} min</strong>
                  </div>
                </>
              )}
            </>
          )}
          {/* Faculty names in info bar */}
          {assignedFaculties.length > 0 && (
            <>
              <div style={S.divider} />
              <div style={S.infoChip}>
                <UserCheck size={14} color="#7c3aed" />
                <span style={S.infoChipLabel}>Faculty</span>
                <span>
                  {assignedFaculties.map((f, i) => (
                    <span key={i}>
                      <span style={{ fontWeight: 600 }}>{f.name}</span>
                      {f.isCoordinator && (
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 8, background: '#ede9fe', color: '#6d28d9', marginLeft: 4 }}>Coord</span>
                      )}
                      {i < assignedFaculties.length - 1 && <span style={{ color: '#94a3b8', margin: '0 4px' }}>·</span>}
                    </span>
                  ))}
                </span>
              </div>
            </>
          )}
        </div>

        {/* ── Level scale ── */}
        <div style={S.scaleBar}>
          <span style={{ color: '#64748b', fontWeight: 600, fontSize: 11 }}>Attainment Scale:</span>
          {LEVEL_LABELS.map((lbl, i) => (
            <span key={i} style={{ ...S.badge(i), fontSize: 11 }}>L{i} = {lbl}</span>
          ))}
          <span style={{ color: '#94a3b8', fontSize: 10, marginLeft: 4 }}>· L0 below threshold · each level adds 10%</span>
          {isAllMode && (
            <span style={{ ...S.formulaChip, marginLeft: 'auto', fontSize: 11, padding: '3px 10px' }}>
              Final = 0.8 × Direct + 0.2 × Indirect
            </span>
          )}
        </div>

        {/* 1 · Assessment Details */}
        <Section
          title={isAllMode ? 'Assessment Details & CLO Coverage' : 'Assessment Details'}
          icon={FileText} iconColor="#2563eb" iconBg="#eff6ff"
          sectionKey="assessmentDetails" expanded={expandedSections.assessmentDetails} onToggle={toggleSection}
          stepNum={1} badge={isAllMode ? `${performanceData.assessments?.length || 0} assessments` : undefined}
        >
          <AssessmentDetailsTable isAllMode={isAllMode} performanceData={performanceData} />
        </Section>

        {/* 2 · Quick Glance */}
        <Section
          title="Quick Glance: CLO Attainment Dashboard"
          icon={Activity} iconColor="#7c3aed" iconBg="#ede9fe"
          sectionKey="quickGlance" expanded={expandedSections.quickGlance} onToggle={toggleSection}
          stepNum={2} badge={`${activeCLOs.length} CLOs`}
        >
          <QuickGlanceDashboard cloList={activeCLOs} />
        </Section>

        {/* 3 · CLO-wise Analysis */}
        <Section
          title="CLO-wise Attainment Analysis"
          icon={Target} iconColor="#0891b2" iconBg="#e0f2fe"
          sectionKey="cloWiseAnalysis" expanded={expandedSections.cloWiseAnalysis} onToggle={toggleSection}
          stepNum={3}
        >
          <CLOAnalysisSection cloList={activeCLOs} calculateAttainmentLevel={calculateAttainmentLevel} />
        </Section>

        {/* 4 · Student Performance */}
        <Section
          title="Student-wise CLO Performance"
          icon={Users} iconColor="#d97706" iconBg="#fef3c7"
          sectionKey="studentPerformance" expanded={expandedSections.studentPerformance} onToggle={toggleSection}
          stepNum={4} badge={`${performanceData.students.length} students`}
        >
          <StudentPerformanceTable
            performanceData={performanceData} cloList={activeCLOs}
            isAllMode={isAllMode} calculateAttainmentLevel={calculateAttainmentLevel}
          />
        </Section>

        {/* 5 · Indirect Assessment (all mode only) */}
        {isAllMode && (
          <Section
            title="Indirect Assessment"
            icon={Upload} iconColor="#059669" iconBg="#d1fae5"
            sectionKey="indirectAssessment" expanded={expandedSections.indirectAssessment} onToggle={toggleSection}
            stepNum={5}
            badge={indirectCloAnalysis ? `✓ ${Object.keys(indirectCloAnalysis).length} CLOs` : 'Pending'}
            badgeVariant={indirectCloAnalysis ? 'success' : 'warn'}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '9px 12px', fontSize: 12, color: '#1d4ed8' }}>
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  Indirect contributes <strong>20%</strong> to final CLO score.
                  Upload ratings on <strong>0–3 scale</strong> (0=Low · 1=Good · 2=Very Good · 3=Excellent).
                  Final = <strong>0.8 × avgDirectLevel + 0.2 × avgIndirectLevel</strong>.
                </span>
              </div>
              {indirectLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', color: '#64748b', fontSize: 13 }}>
                  <div className="spinner" style={{ width: 18, height: 18 }} />
                  <span>Loading indirect data…</span>
                </div>
              ) : !Array.isArray(indirectData) || !indirectData.length ? (
                <IndirectUploadPanel
                  course={course} closData={closData}
                  semester={performanceData.course.semester} year={performanceData.course.year}
                  onUploaded={() => loadIndirectData(performanceData.course.semester, performanceData.course.year)}
                />
              ) : (
                <IndirectDataView indirectData={indirectData} indirectCloAnalysis={indirectCloAnalysis} />
              )}
            </div>
          </Section>
        )}

        {/* 6 · CLO Attainment Summary + Course Final Score */}
        <Section
          title="CLO Attainment Summary & Final Score"
          icon={Award} iconColor="#dc2626" iconBg="#fee2e2"
          sectionKey="attainmentSummary" expanded={expandedSections.attainmentSummary} onToggle={toggleSection}
          stepNum={isAllMode ? 6 : 5}
          badge={isAllMode && indirectCloAnalysis ? '80/20 formula applied' : undefined}
          badgeVariant="success"
        >
          <AttainmentSummary cloList={activeCLOs} hasIndirectData={!!indirectCloAnalysis} />
        </Section>
      </div>
    </div>
  );
};

export default StudentPerformanceAnalysis;