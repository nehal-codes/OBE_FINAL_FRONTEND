
// export function getStudentAttainmentLevel(percentage, threshold) {
//   if (percentage < threshold) return 0;
//   if (percentage < threshold + 10) return 1;
//   if (percentage < threshold + 20) return 2;
//   return 3;
// }

// /**
//  * Map class-level attainment % to direct attainment level
//  * >= 60% students attained => Level 3
//  * 50-59%                   => Level 2
//  * < 50%                    => Level 1
//  */
// export function getDirectAttainmentLevel(classAttainmentPercent) {
//   if (classAttainmentPercent >= 60) return 3;
//   if (classAttainmentPercent >= 50) return 2;
//   return 1;
// }

// /**
//  * Calculate total CO attainment = 0.8 * direct + 0.2 * indirect
//  * indirectLevel defaults to 2.5 if not provided
//  */
// export function getTotalCOAttainment(directLevel, indirectLevel = 2.5) {
//   return (0.8 * directLevel + 0.2 * indirectLevel).toFixed(2);
// }

// // ─── HTML REPORT ─────────────────────────────────────────────────────────────

// export function generateOBEReport(performanceData, analysisMode = 'single') {
//   if (!performanceData) return '';

//   const now = new Date().toLocaleString();
//   const course = performanceData.course;
//   const clos = performanceData.clos || [];
//   const students = performanceData.students || [];

//   // ── shared helpers ──────────────────────────────────────────────────────
//   const pct = (n) => (typeof n === 'number' ? n.toFixed(1) + '%' : 'N/A');
//   const levelBadge = (lvl) => {
//     const colors = { 0: '#ef4444', 1: '#f59e0b', 2: '#3b82f6', 3: '#22c55e' };
//     const labels = { 0: 'Not Attained', 1: 'Level 1', 2: 'Level 2', 3: 'Level 3' };
//     return `<span style="background:${colors[lvl]};color:#fff;padding:2px 8px;border-radius:12px;font-size:11px;font-weight:700;">${labels[lvl]}</span>`;
//   };

//   // ── per-CLO computation ─────────────────────────────────────────────────
//   const cloReports = clos.map((clo) => {
//     const stats = performanceData.statistics?.cloStatistics?.[clo.id] || {};
//     const threshold = clo.threshold || stats.threshold || 50;

//     // Student-level attainment
//     const studentRows = students.map((s) => {
//       const perf = s.cloPerformance?.[clo.id] || {};
//       const obtained = perf.obtained ?? 0;
//       const maxMarks = perf.maxMarks ?? clo.maxMarks ?? 0;
//       const percentage = perf.percentage ?? (maxMarks > 0 ? (obtained / maxMarks) * 100 : 0);
//       const level = getStudentAttainmentLevel(percentage, threshold);
//       const attained = level > 0;

//       return { rollNumber: s.rollNumber, name: s.name, obtained, maxMarks, percentage, level, attained };
//     });

//     const studentsAttained = studentRows.filter((r) => r.attained).length;
//     const total = studentRows.length;
//     const classAttainmentPct = total > 0 ? (studentsAttained / total) * 100 : 0;
//     const directLevel = getDirectAttainmentLevel(classAttainmentPct);
//     const totalAttainment = getTotalCOAttainment(directLevel);

//     return { clo, threshold, studentRows, studentsAttained, total, classAttainmentPct, directLevel, totalAttainment, stats };
//   });

//   // ── assessment context ──────────────────────────────────────────────────
//   const assessmentTitle =
//     analysisMode === 'all'
//       ? `Combined – All ${performanceData.assessments?.length || ''} Assessments`
//       : performanceData.assessment?.title || 'Assessment';

//   // ── SECTION builders ───────────────────────────────────────────────────

//   function sectionHeader(icon, title) {
//     return `
//       <div class="sec-header">
//         <span class="sec-icon">${icon}</span>
//         <h2>${title}</h2>
//       </div>`;
//   }

//   function buildCoverPage() {
//     return `
//       <div class="cover-page">
//         <div class="cover-logo">📊 OBE Attainment Report</div>
//         <h1 class="cover-title">${course.code} – ${course.name}</h1>
//         <p class="cover-sub">${assessmentTitle}</p>
//         <div class="cover-meta">
//           <div class="cover-meta-item"><span>Semester</span><strong>${course.semester || 'N/A'}</strong></div>
//           <div class="cover-meta-item"><span>Year</span><strong>${course.year || 'N/A'}</strong></div>
//           <div class="cover-meta-item"><span>Credits</span><strong>${course.credits || 'N/A'}</strong></div>
//           <div class="cover-meta-item"><span>Students</span><strong>${students.length}</strong></div>
//           <div class="cover-meta-item"><span>CLOs</span><strong>${clos.length}</strong></div>
//           <div class="cover-meta-item"><span>Generated</span><strong>${now}</strong></div>
//         </div>
//       </div>`;
//   }

//   function buildCLODefinitions() {
//     return `
//       ${sectionHeader('📋', 'Section 1 – Course Learning Outcomes (CLOs) Defined')}
//       <p class="sec-desc">The following CLOs define the expected learning outcomes for this course. Each CLO is mapped to Bloom's Taxonomy and has a pre-defined attainment threshold.</p>
//       <table>
//         <thead><tr><th>CLO</th><th>Statement</th><th>Bloom's Level</th><th>Threshold</th></tr></thead>
//         <tbody>
//           ${clos.map((c) => `
//             <tr>
//               <td><strong>${c.code}</strong></td>
//               <td>${c.statement || '—'}</td>
//               <td>${c.bloomLevel || 'N/A'}</td>
//               <td>${c.threshold || 50}%</td>
//             </tr>`).join('')}
//         </tbody>
//       </table>`;
//   }

//   function buildAttainmentScaleTable() {
//     return `
//       ${sectionHeader('📏', 'Section 2 – Attainment Scale Reference')}
//       <p class="sec-desc">Student-level attainment is categorised into four levels based on their score relative to the CLO threshold.</p>
//       <table class="scale-table">
//         <thead><tr><th>Level</th><th>Score Range</th><th>Description</th></tr></thead>
//         <tbody>
//           <tr><td>${levelBadge(0)}</td><td>Below Threshold</td><td>Student did not meet the minimum threshold for this CLO</td></tr>
//           <tr><td>${levelBadge(1)}</td><td>Threshold ≤ Score &lt; Threshold + 10%</td><td>Basic attainment — just met expectations</td></tr>
//           <tr><td>${levelBadge(2)}</td><td>Threshold + 10% ≤ Score &lt; Threshold + 20%</td><td>Moderate attainment — exceeded basic expectations</td></tr>
//           <tr><td>${levelBadge(3)}</td><td>Score ≥ Threshold + 20%</td><td>High attainment — strongly met and exceeded expectations</td></tr>
//         </tbody>
//       </table>
//       <br/>
//       <p class="sec-desc"><strong>Class-Level → Direct Attainment Level Mapping:</strong></p>
//       <table class="scale-table">
//         <thead><tr><th>Class Attainment %</th><th>Direct Attainment Level</th><th>Description</th></tr></thead>
//         <tbody>
//           <tr><td>≥ 60% of students attained</td><td>${levelBadge(3)}</td><td>High Attainment</td></tr>
//           <tr><td>50% – 59% of students attained</td><td>${levelBadge(2)}</td><td>Medium Attainment</td></tr>
//           <tr><td>&lt; 50% of students attained</td><td>${levelBadge(1)}</td><td>Low Attainment</td></tr>
//         </tbody>
//       </table>`;
//   }

//   function buildCLOWiseStudentAttainment() {
//     return cloReports.map(({ clo, threshold, studentRows }, idx) => `
//       <div class="page-break"></div>
//       ${sectionHeader('👤', `Section 3.${idx + 1} – Student-Level Attainment: ${clo.code}`)}
//       <p class="sec-desc"><strong>CLO Statement:</strong> ${clo.statement || '—'}<br/>
//         <strong>Max Marks:</strong> ${clo.maxMarks} &nbsp;|&nbsp; <strong>Threshold:</strong> ${threshold}%</p>
//       <table>
//         <thead>
//           <tr>
//             <th>#</th>
//             <th>Roll No.</th>
//             <th>Student Name</th>
//             <th>Marks Scored<br/><small>(out of ${clo.maxMarks})</small></th>
//             <th>Percentage</th>
//             <th>Attained?</th>
//             <th>Level</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${studentRows.map((r, i) => `
//             <tr class="${r.attained ? 'row-attained' : 'row-not-attained'}">
//               <td>${i + 1}</td>
//               <td>${r.rollNumber}</td>
//               <td>${r.name}</td>
//               <td>${r.obtained.toFixed(1)} / ${r.maxMarks}</td>
//               <td>${pct(r.percentage)}</td>
//               <td>${r.attained ? '✅ Attained' : '❌ Not Attained'}</td>
//               <td>${levelBadge(r.level)}</td>
//             </tr>`).join('')}
//         </tbody>
//       </table>`).join('');
//   }

//   function buildClassLevelAttainment() {
//     return `
//       <div class="page-break"></div>
//       ${sectionHeader('🏫', 'Section 4 – Class-Level Attainment per CLO')}
//       <p class="sec-desc">
//         Class-level attainment measures what percentage of students successfully attained each CLO.
//         This is used to derive the Direct Attainment Level, which feeds into the Total CO Attainment.
//       </p>
//       <table>
//         <thead>
//           <tr>
//             <th>CLO</th>
//             <th>Threshold</th>
//             <th>Students Attained</th>
//             <th>Total Students</th>
//             <th>Class Attainment %</th>
//             <th>Class Avg. Score</th>
//             <th>Direct Attainment Level</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${cloReports.map(({ clo, threshold, studentsAttained, total, classAttainmentPct, directLevel, stats }) => `
//             <tr class="${classAttainmentPct >= 60 ? 'row-attained' : classAttainmentPct >= 50 ? 'row-medium' : 'row-not-attained'}">
//               <td><strong>${clo.code}</strong></td>
//               <td>${threshold}%</td>
//               <td>${studentsAttained}</td>
//               <td>${total}</td>
//               <td><strong>${pct(classAttainmentPct)}</strong></td>
//               <td>${pct(stats?.average)}</td>
//               <td>${levelBadge(directLevel)}</td>
//             </tr>`).join('')}
//         </tbody>
//       </table>`;
//   }

//   function buildTotalAttainmentSummary() {
//     return `
//       <div class="page-break"></div>
//       ${sectionHeader('🎯', 'Section 5 – Total CO Attainment Summary')}
//       <p class="sec-desc">
//         Total CO Attainment = <strong>(0.8 × Direct Attainment Level) + (0.2 × Indirect Attainment Level)</strong><br/>
//         <em>Note: Indirect attainment level is based on student exit surveys / feedback (default assumed 2.5 pending survey data).</em>
//       </p>
//       <table>
//         <thead>
//           <tr>
//             <th>CLO</th>
//             <th>Class Attainment %</th>
//             <th>Direct Attainment Level (80%)</th>
//             <th>Indirect Attainment Level (20%)</th>
//             <th>Total CO Attainment</th>
//             <th>Interpretation</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${cloReports.map(({ clo, classAttainmentPct, directLevel, totalAttainment }) => {
//             const t = parseFloat(totalAttainment);
//             const interp = t >= 2.5 ? '✅ High' : t >= 1.5 ? '⚠️ Moderate' : '❌ Low';
//             return `
//             <tr class="${t >= 2.5 ? 'row-attained' : t >= 1.5 ? 'row-medium' : 'row-not-attained'}">
//               <td><strong>${clo.code}</strong></td>
//               <td>${pct(classAttainmentPct)}</td>
//               <td>${levelBadge(directLevel)}</td>
//               <td>2.5 (assumed)</td>
//               <td><strong style="font-size:16px">${totalAttainment}</strong></td>
//               <td>${interp}</td>
//             </tr>`;
//           }).join('')}
//         </tbody>
//       </table>
//       <div class="callout">
//         <strong>Formula:</strong> Total CO Attainment = (0.8 × Direct Level) + (0.2 × 2.5)<br/>
//         Replace indirect level value once survey data is available.
//       </div>`;
//   }

//   function buildAssessmentWiseSection() {
//     if (analysisMode !== 'all' || !performanceData.assessmentWiseData) return '';

//     return `
//       <div class="page-break"></div>
//       ${sectionHeader('📄', 'Section 6 – Assessment-Wise Performance Breakdown')}
//       <p class="sec-desc">Individual assessment statistics contributing to the combined course-level analysis.</p>
//       <table>
//         <thead>
//           <tr>
//             <th>Assessment</th>
//             <th>Type</th>
//             <th>Max Marks</th>
//             <th>Class Average</th>
//             <th>Students Attained</th>
//             <th>Attainment Rate</th>
//             <th>Score Range</th>
//           </tr>
//         </thead>
//         <tbody>
//           ${performanceData.assessmentWiseData.map((data) => {
//             const rate = (data.statistics.studentsAboveThreshold / data.statistics.totalStudents) * 100;
//             return `
//             <tr class="${rate >= 60 ? 'row-attained' : rate >= 50 ? 'row-medium' : 'row-not-attained'}">
//               <td><strong>${data.assessment.title}</strong></td>
//               <td>${data.assessment.type || 'N/A'}</td>
//               <td>${data.assessment.maxMarks}</td>
//               <td>${pct(data.statistics.classAverage)}</td>
//               <td>${data.statistics.studentsAboveThreshold} / ${data.statistics.totalStudents}</td>
//               <td>${pct(rate)}</td>
//               <td>${data.statistics.minScore.toFixed(0)}% – ${data.statistics.maxScore.toFixed(0)}%</td>
//             </tr>`;
//           }).join('')}
//         </tbody>
//       </table>`;
//   }

//   function buildGapAnalysis() {
//     const gaps = cloReports.filter(({ classAttainmentPct }) => classAttainmentPct < 50);
//     const strong = cloReports.filter(({ classAttainmentPct }) => classAttainmentPct >= 60);

//     return `
//       <div class="page-break"></div>
//       ${sectionHeader('🔍', 'Section 7 – Gap Analysis & Recommendations')}
//       <p class="sec-desc">This section identifies CLOs that need attention and highlights areas of strength.</p>

//       <h3 style="color:#ef4444;margin-top:20px">⚠️ CLOs with Low Attainment (&lt; 50% class attainment)</h3>
//       ${gaps.length === 0
//         ? '<p class="good-msg">✅ No CLOs fall below the 50% threshold. All CLOs have satisfactory class-level attainment.</p>'
//         : `<table>
//             <thead><tr><th>CLO</th><th>Class Attainment</th><th>Possible Issue</th><th>Recommended Action</th></tr></thead>
//             <tbody>
//               ${gaps.map(({ clo, classAttainmentPct }) => `
//                 <tr class="row-not-attained">
//                   <td><strong>${clo.code}</strong></td>
//                   <td>${pct(classAttainmentPct)}</td>
//                   <td>Teaching strategy or assessment difficulty may need review</td>
//                   <td>Review CA-CLO effectiveness; provide remedial sessions; revise assessment design</td>
//                 </tr>`).join('')}
//             </tbody>
//           </table>`}

//       <h3 style="color:#22c55e;margin-top:24px">✅ High Performing CLOs (≥ 60% class attainment)</h3>
//       ${strong.length === 0
//         ? '<p>No CLOs currently meet the high attainment benchmark.</p>'
//         : `<table>
//             <thead><tr><th>CLO</th><th>Class Attainment</th><th>Direct Level</th><th>Note</th></tr></thead>
//             <tbody>
//               ${strong.map(({ clo, classAttainmentPct, directLevel }) => `
//                 <tr class="row-attained">
//                   <td><strong>${clo.code}</strong></td>
//                   <td>${pct(classAttainmentPct)}</td>
//                   <td>${levelBadge(directLevel)}</td>
//                   <td>Maintain current teaching strategies; can serve as best-practice reference</td>
//                 </tr>`).join('')}
//             </tbody>
//           </table>`}

//       <div class="callout">
//         <strong>CA-CLO Effectiveness Guiding Question:</strong><br/>
//         "Which Course Activity (CA) didn't help achieve a CLO? Why?" — Review specific assessment components
//         where students consistently underperformed on a given CLO. If a CLO was primarily assessed through
//         a single assignment or exam section that yielded poor results, that activity should be revised for future offerings.
//       </div>`;
//   }

//   function buildOverallSummary() {
//     const totalStudents = students.length;
//     const classAvg = performanceData.statistics?.classAverage || 0;
//     const studentsAbove = performanceData.statistics?.studentsAboveThreshold || 0;
//     const highCLOs = cloReports.filter(r => r.classAttainmentPct >= 60).length;
//     const lowCLOs = cloReports.filter(r => r.classAttainmentPct < 50).length;

//     return `
//       ${sectionHeader('📊', 'Executive Summary')}
//       <div class="summary-grid">
//         <div class="summary-card-box">
//           <div class="scb-value">${classAvg.toFixed(1)}%</div>
//           <div class="scb-label">Class Average</div>
//         </div>
//         <div class="summary-card-box">
//           <div class="scb-value">${studentsAbove}/${totalStudents}</div>
//           <div class="scb-label">Students Met All Thresholds</div>
//         </div>
//         <div class="summary-card-box">
//           <div class="scb-value">${highCLOs}</div>
//           <div class="scb-label">High Attainment CLOs</div>
//         </div>
//         <div class="summary-card-box ${lowCLOs > 0 ? 'scb-warn' : ''}">
//           <div class="scb-value">${lowCLOs}</div>
//           <div class="scb-label">CLOs Needing Attention</div>
//         </div>
//       </div>`;
//   }

//   // ── FULL HTML DOCUMENT ──────────────────────────────────────────────────
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//   <title>OBE Attainment Report – ${course.code}</title>
//   <style>
//     @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,300;0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;600&display=swap');

//     *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

//     :root {
//       --ink: #1a1a2e;
//       --ink-light: #4a4a6a;
//       --paper: #faf9f7;
//       --paper-alt: #f0ede8;
//       --accent: #2563eb;
//       --accent-light: #eff6ff;
//       --border: #d8d4ce;
//       --success: #15803d;
//       --success-bg: #f0fdf4;
//       --warn-bg: #fff7ed;
//       --danger-bg: #fef2f2;
//       --medium-bg: #fefce8;
//     }

//     body {
//       font-family: 'Source Serif 4', Georgia, serif;
//       background: var(--paper);
//       color: var(--ink);
//       font-size: 13px;
//       line-height: 1.6;
//     }

//     /* COVER */
//     .cover-page {
//       min-height: 100vh;
//       display: flex;
//       flex-direction: column;
//       align-items: center;
//       justify-content: center;
//       text-align: center;
//       padding: 60px 40px;
//       background: var(--ink);
//       color: #fff;
//     }
//     .cover-logo {
//       font-family: 'JetBrains Mono', monospace;
//       font-size: 13px;
//       letter-spacing: 4px;
//       text-transform: uppercase;
//       color: #94a3b8;
//       margin-bottom: 40px;
//     }
//     .cover-title {
//       font-size: 38px;
//       font-weight: 700;
//       line-height: 1.2;
//       margin-bottom: 16px;
//       max-width: 700px;
//     }
//     .cover-sub {
//       font-size: 18px;
//       font-weight: 300;
//       color: #94a3b8;
//       margin-bottom: 60px;
//       font-style: italic;
//     }
//     .cover-meta {
//       display: flex;
//       flex-wrap: wrap;
//       gap: 16px;
//       justify-content: center;
//     }
//     .cover-meta-item {
//       background: rgba(255,255,255,0.07);
//       border: 1px solid rgba(255,255,255,0.12);
//       border-radius: 8px;
//       padding: 12px 24px;
//       min-width: 120px;
//     }
//     .cover-meta-item span { display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
//     .cover-meta-item strong { display: block; font-size: 18px; }

//     /* REPORT BODY */
//     .report-body { max-width: 960px; margin: 0 auto; padding: 48px 32px; }

//     /* SECTION HEADER */
//     .sec-header {
//       display: flex;
//       align-items: center;
//       gap: 12px;
//       margin: 48px 0 16px;
//       padding-bottom: 12px;
//       border-bottom: 2px solid var(--ink);
//     }
//     .sec-icon { font-size: 22px; }
//     .sec-header h2 { font-size: 18px; font-weight: 700; color: var(--ink); }

//     .sec-desc {
//       color: var(--ink-light);
//       margin-bottom: 16px;
//       font-size: 13px;
//       line-height: 1.7;
//     }

//     /* TABLES */
//     table {
//       width: 100%;
//       border-collapse: collapse;
//       font-size: 12px;
//       margin-bottom: 24px;
//     }
//     th {
//       background: var(--ink);
//       color: #fff;
//       padding: 10px 14px;
//       text-align: left;
//       font-family: 'JetBrains Mono', monospace;
//       font-size: 10px;
//       letter-spacing: 0.5px;
//       font-weight: 600;
//     }
//     td {
//       padding: 9px 14px;
//       border-bottom: 1px solid var(--border);
//       vertical-align: top;
//     }
//     tr:nth-child(even) td { background: var(--paper-alt); }

//     .row-attained td { background: var(--success-bg) !important; }
//     .row-medium td { background: var(--medium-bg) !important; }
//     .row-not-attained td { background: var(--danger-bg) !important; }

//     /* SUMMARY GRID */
//     .summary-grid {
//       display: grid;
//       grid-template-columns: repeat(4, 1fr);
//       gap: 16px;
//       margin: 20px 0 32px;
//     }
//     .summary-card-box {
//       border: 2px solid var(--border);
//       border-radius: 10px;
//       padding: 20px;
//       text-align: center;
//     }
//     .scb-warn { border-color: #ef4444; background: var(--danger-bg); }
//     .scb-value { font-size: 28px; font-weight: 700; color: var(--accent); font-family: 'JetBrains Mono', monospace; }
//     .scb-label { font-size: 11px; color: var(--ink-light); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.5px; }

//     /* CALLOUT */
//     .callout {
//       background: var(--accent-light);
//       border-left: 4px solid var(--accent);
//       padding: 14px 18px;
//       border-radius: 0 8px 8px 0;
//       font-size: 12px;
//       line-height: 1.7;
//       margin: 16px 0;
//       color: #1e40af;
//     }

//     .good-msg {
//       background: var(--success-bg);
//       border-left: 4px solid var(--success);
//       padding: 12px 16px;
//       border-radius: 0 8px 8px 0;
//       color: var(--success);
//       font-size: 13px;
//     }

//     /* PAGE BREAK */
//     .page-break { page-break-before: always; margin-top: 0; }

//     h3 { font-size: 14px; margin: 16px 0 10px; }

//     /* PRINT */
//     @media print {
//       body { font-size: 11px; }
//       .cover-page { min-height: auto; padding: 40px; }
//       .cover-title { font-size: 28px; }
//       .summary-grid { grid-template-columns: repeat(4, 1fr); }
//       .page-break { page-break-before: always; }
//     }
//   </style>
// </head>
// <body>

// ${buildCoverPage()}

// <div class="report-body">

// ${buildOverallSummary()}
// ${buildCLODefinitions()}
// ${buildAttainmentScaleTable()}
// ${buildCLOWiseStudentAttainment()}
// ${buildClassLevelAttainment()}
// ${buildTotalAttainmentSummary()}
// ${buildAssessmentWiseSection()}
// ${buildGapAnalysis()}

// <div style="margin-top:60px;padding-top:24px;border-top:1px solid var(--border);color:var(--ink-light);font-size:11px;text-align:center;">
//   Generated by OBE Attainment System &nbsp;|&nbsp; ${now} &nbsp;|&nbsp; ${course.code} – ${course.name}
// </div>

// </div>
// </body>
// </html>`;
// }

// // ─── REACT HOOK / BUTTON ─────────────────────────────────────────────────────

// import React from 'react';
// import { FileText } from 'lucide-react';

// export function OBEReportDownloadButton({ performanceData, analysisMode, className = '' }) {
//   const handleDownload = () => {
//     const html = generateOBEReport(performanceData, analysisMode);
//     const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
//     const url = URL.createObjectURL(blob);

//     // Open in new tab for print/save-as-PDF
//     const win = window.open(url, '_blank');
//     if (win) {
//       win.onload = () => {
//         win.print();
//       };
//     }

//     // Also trigger download
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `OBE_Report_${performanceData?.course?.code || 'course'}_${analysisMode}.html`;
//     a.click();
//     setTimeout(() => URL.revokeObjectURL(url), 5000);
//   };

//   if (!performanceData) return null;

//   return (
//     <button
//       className={`btn-obe-report ${className}`}
//       onClick={handleDownload}
//       title="Download OBE Attainment Report"
//       style={{
//         display: 'inline-flex',
//         alignItems: 'center',
//         gap: '8px',
//         padding: '8px 16px',
//         background: '#1a1a2e',
//         color: '#fff',
//         border: 'none',
//         borderRadius: '8px',
//         fontSize: '13px',
//         fontWeight: '600',
//         cursor: 'pointer',
//         fontFamily: 'inherit',
//       }}
//     >
//       <FileText size={16} />
//       OBE Report
//     </button>
//   );
// }