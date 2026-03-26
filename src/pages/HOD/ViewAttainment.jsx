import React, { useState, useEffect, useRef } from "react";
import html2pdf from "html2pdf.js";
import coursesAPI from "../../apis/HOD/courses.api";
import reportsAPI from "../../apis/HOD/reports.api";

/* COLORS SAME AS PDF */
const LEVEL_COLORS = {
  0: "#dc2626",
  1: "#d97706",
  2: "#2563eb",
  3: "#16a34a",
};

const levelLabel = (l) => ["Low", "Good", "Very Good", "Excellent"][l];

/* Helper function to calculate attainment level */
const calculateAttainmentLevel = (percentage, threshold) => {
  if (percentage < threshold) return 0;
  if (percentage < threshold + 10) return 1;
  if (percentage < threshold + 20) return 2;
  return 3;
};

/* Sort CLOs by code */
const sortCLOs = (clos) => {
  if (!clos || !Array.isArray(clos)) return [];
  return [...clos].sort((a, b) => {
    const aNum = parseInt(a.cloCode?.match(/\d+/) || [0]);
    const bNum = parseInt(b.cloCode?.match(/\d+/) || [0]);
    return aNum - bNum;
  });
};

/* Build PDF HTML using the template – with page numbers via CSS */
const buildPDFHTML = (data) => {
  if (!data) return "<div>No data available</div>";

  const {
    courseSummary,
    cloDetails,
    courseCode,
    courseName,
    semester,
    year,
    facultyName,
  } = data;

  const cl = sortCLOs(cloDetails || []);
  const hi = cloDetails?.some((clo) => clo.indirect?.levelLabel);

  const lc = LEVEL_COLORS;

  const cD =
    cl.length > 0
      ? cl.reduce((s, c) => s + (c.direct?.level || 0), 0) / cl.length
      : 0;
  const cI =
    hi && cl.length > 0
      ? cl.reduce((s, c) => s + (c.indirect?.level || 0), 0) / cl.length
      : null;
  const cF = courseSummary?.finalScore || (hi ? 0.8 * cD + 0.2 * cI : cD);
  const cFL = courseSummary?.finalLevel || Math.min(3, Math.round(cF));

  const facultyLine = facultyName
    ? `<div class="faculty-line"><strong>Faculty:</strong> ${facultyName}</div>`
    : "";

  const cloRows = cl
    .map((clo) => {
      const direct = clo.direct || {};
      const indirect = clo.indirect || {};
      const hasIndirect = hi && indirect.level !== undefined;

      const fS = clo.final?.score || direct.level || 0;
      const fL = clo.final?.level || direct.level || 0;

      const indC = hasIndirect
        ? `|<td>${indirect.avgLevel?.toFixed(2) || "—"}</td><td style="color:${lc[indirect.level]};font-weight:600">L${indirect.level} ${indirect.levelLabel || levelLabel(indirect.level)}</td>`
        : "";

      return `<tr>
        <td><strong>${clo.cloCode || "N/A"}</strong></td>
        <td>${clo.bloomLevel || "N/A"}</td>
        <td>${clo.threshold || 0}%</td>
        <td>${direct.attainedStudents || 0}/${direct.totalStudents || 0}</td>
        <td>${(direct.level || 0).toFixed(2)}</td>
        <td style="color:${lc[direct.level]};font-weight:600">L${direct.level} ${direct.levelLabel || levelLabel(direct.level)}</td>
        ${indC}
        <td><strong>${fS.toFixed(2)}</strong></td>
        <td style="color:${lc[fL]};font-weight:700">L${fL} ${levelLabel(fL)}</td>
      </tr>`;
    })
    .join("");

  let indSec = "";
  if (hi && cloDetails) {
    indSec =
      `<h2><strong>Indirect Assessment — Student Ratings</strong></h2>` +
      cl
        .filter((clo) => clo.indirect?.studentRatings)
        .map((clo) => {
          const ratings = clo.indirect.studentRatings || [];
          const rows = ratings
            .slice(0, 60)
            .map(
              (s) =>
                `<tr><td>${s.rollNumber || s.rollNo || "N/A"}</td><td>${s.name || "N/A"}</td><td>L${s.level} ${levelLabel(s.level)}</td></tr>`,
            )
            .join("");
          return `<h4><strong>${clo.cloCode}</strong> — avg level: ${clo.indirect.avgLevel?.toFixed(2) || "N/A"} | L${clo.indirect.level} ${clo.indirect.levelLabel || levelLabel(clo.indirect.level)}</h4>
        <p style="font-size:10px;color:#64748b;margin:0 0 6px">${ratings.length} students · Scale 0–3</p>
        <table><thead><tr><th>Roll No</th><th>Student</th><th>Level</th></tr></thead><tbody>${rows}</tbody></table>`;
        })
        .join("");
  }

  let studentTable = "";
  if (
    cloDetails &&
    cloDetails.length > 0 &&
    cloDetails[0].direct?.studentScores
  ) {
    const studentScores = cloDetails[0].direct.studentScores || [];
    const cloH = cl
      .map((c) => `<th colspan="2"><strong>${c.cloCode}</strong></th>`)
      .join("");
    const cloS = cl.map(() => `<th>Score%</th><th>Lvl</th>`).join("");

    const sRows = studentScores
      .slice(0, 100)
      .map((student) => {
        const cells = cl
          .map((clo) => {
            const studentData = clo.direct?.studentScores?.find(
              (s) => s.rollNumber === student.rollNumber,
            );
            const pct = studentData?.percentage || 0;
            const lvl = calculateAttainmentLevel(pct, clo.threshold || 0);
            return `<td>${pct.toFixed(1)}%</td><td>L${lvl}</td>`;
          })
          .join("");
        return `<tr>
          <td><strong>${student.rollNumber}</strong></td>
          <td><strong>${student.name}</strong></td>
          ${cells}
          <td><strong>${student.percentage?.toFixed(1) || "0"}%</strong></td>
        </tr>`;
      })
      .join("");

    studentTable = `
      <h2><strong>Student-wise CLO Performance</strong>${studentScores.length > 100 ? " (first 100)" : ""}</h2>
      <table>
        <thead>
          <tr><th>Roll No.</th><th>Name</th>${cloH}<th>Overall %</th></tr>
          <tr><th></th><th></th>${cloS}<th></th></tr>
        </thead>
        <tbody>${sRows}</tbody>
      </table>
    `;
  }

  return `<!DOCTYPE html><html><head><title>${courseCode || "Course"} Course Level Attainment Report</title>
<style>
  body {
    font-family: Arial, sans-serif;
    font-size: 11px;
    color: #111;
    margin: 20px;
    position: relative;
  }
  h1 { font-size: 20px; color: #1e40af; margin-bottom: 0; }
  h2 { font-size: 16px; color: #1e293b; margin: 20px 0 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
  h3 { font-size: 14px; color: #334155; margin: 4px 0 10px; }
  h4 { font-size: 11px; margin: 14px 0 4px; color: #374151; }
  .meta { font-size: 10px; color: #64748b; margin-bottom: 5px; }
  .faculty-line { font-size: 11px; color: #334155; background: #f8fafc; padding: 6px 10px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #1e40af; }
  .scale { font-size: 10px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 5px 10px; margin: 6px 0; }
  .sum-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px 14px; margin: 10px 0; }
  .sum-item { display: flex; flex-direction: column; gap: 2px; }
  .sum-lbl { font-size: 9px; color: #6b7280; text-transform: uppercase; }
  .sum-val { font-size: 14px; font-weight: 700; }
  .formula { background: #fefce8; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 12px; margin: 8px 0; font-size: 10px; color: #78350f; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 10px; }
  th { background: #f1f5f9; padding: 6px 8px; text-align: left; border: 1px solid #e2e8f0; font-weight: 600; }
  td { padding: 5px 8px; border: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  /* Page number styling */
  @page {
    margin: 0.5in;
    @bottom-right {
      content: "Page " counter(page) " of " counter(pages);
      font-size: 9px;
      color: #666;
      font-family: Arial, sans-serif;
    }
  }
  @media print {
    body { margin: 0; }
    .faculty-line { border-left: 4px solid #000; }
  }
</style>
</head><body>
<h1><strong>${courseCode || "N/A"} — ${courseName || "N/A"}</strong></h1>
<h3><strong>Course Level Attainment Report</strong></h3>
<div class="meta">Semester: ${semester || "N/A"} &nbsp;|&nbsp; Academic Year: ${year || "N/A"} &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString()}</div>
${facultyLine}
<div class="scale">Level Scale: L0=Low (below threshold) · L1=Good (+0–10%) · L2=Very Good (+10–20%) · L3=Excellent (≥+20%) &nbsp;|&nbsp; Formula: 0.8 × Direct + 0.2 × Indirect (when available)</div>
<div class="sum-grid">
  <div class="sum-item"><span class="sum-lbl">Avg Direct Level</span><span class="sum-val">${cD.toFixed(2)}</span></div>
  ${hi ? `<div class="sum-item"><span class="sum-lbl">Avg Indirect Level</span><span class="sum-val">${cI?.toFixed(2) || "0.00"}</span></div>` : "<div></div>"}
  <div class="sum-item"><span class="sum-lbl">Final Score</span><span class="sum-val" style="color:${lc[cFL]}">${cF.toFixed(2)} — L${cFL} ${levelLabel(cFL)}</span></div>
</div>
<div class="formula"><strong>Formula:</strong> ${hi ? `0.8 × ${cD.toFixed(2)} (Direct) + 0.2 × ${cI?.toFixed(2) || "0.00"} (Indirect) = ${cF.toFixed(2)}` : "Direct Attainment Only — no indirect data uploaded"}</div>
<h2><strong>CLO Attainment Summary</strong></h2>
<table>
  <thead>
    <tr>
      <th>CLO</th><th>Bloom's</th><th>Threshold</th><th>Attained</th>
      <th>Avg Direct Lvl</th><th>Direct Level</th>
      ${hi ? "<th>Avg Indirect Lvl</th><th>Indirect Level</th>" : ""}
      <th>Final Score</th><th>Final Level</th>
    </tr>
  </thead>
  <tbody>${cloRows}</tbody>
</table>
${indSec}
${studentTable}
</body></html>`;
};

const ViewAttainment = () => {
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reportRef = useRef();

  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  useEffect(() => {
    if (selectedSemester && selectedYear) fetchCourses();
  }, [selectedSemester, selectedYear]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await coursesAPI.getCoursesByAcademicPeriod(
        parseInt(selectedYear),
        parseInt(selectedSemester),
        token,
      );
      setCourses(res.data.data || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch courses");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (courseId) => {
    if (!courseId) return;
    try {
      setLoading(true);
      setSelectedCourse(courseId);
      const token = localStorage.getItem("token");
      const res = await reportsAPI.getCourseAttainment(
        courseId,
        parseInt(selectedYear),
        parseInt(selectedSemester),
        token,
      );
      setData(res.data.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch attainment data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportRef.current) return;
    const opt = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: `${data?.courseCode || "course"}_attainment_report.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, letterRendering: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  if (!selectedSemester || !selectedYear) {
    return (
      <div style={{ background: "#f3f4f6", padding: 24, minHeight: "100vh" }}>
        <div
          style={{
            background: "white",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <h3>Select filters to view attainment report</h3>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <select
              onChange={(e) => setSelectedYear(e.target.value)}
              value={selectedYear}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
            >
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              onChange={(e) => setSelectedSemester(e.target.value)}
              value={selectedSemester}
              style={{
                padding: 8,
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={{ background: "#f3f4f6", padding: 24, minHeight: "100vh" }}>
        <div
          style={{
            background: "white",
            padding: 16,
            borderRadius: 12,
            boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
          }}
        >
          <h3>Loading...</h3>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f3f4f6", padding: 24, minHeight: "100vh" }}>
      {/* Filter Section – Enhanced */}
      <div
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)",
          padding: 20,
          marginBottom: 20,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
          <div style={{ flex: 1, minWidth: 150 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 6,
                color: "#374151",
              }}
            >
              Academic Year
            </label>
            <select
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setData(null);
                setSelectedCourse("");
              }}
              value={selectedYear}
              style={{
                padding: "8px 12px",
                width: "100%",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                backgroundColor: "white",
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <option value="">Select Year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: 150 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 6,
                color: "#374151",
              }}
            >
              Semester
            </label>
            <select
              onChange={(e) => {
                setSelectedSemester(e.target.value);
                setData(null);
                setSelectedCourse("");
              }}
              value={selectedSemester}
              style={{
                padding: "8px 12px",
                width: "100%",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                backgroundColor: "white",
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <option value="">Select Semester</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 2, minWidth: 250 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 6,
                color: "#374151",
              }}
            >
              Course
            </label>
            <select
              onChange={(e) => handleCourseSelect(e.target.value)}
              value={selectedCourse}
              style={{
                padding: "8px 12px",
                width: "100%",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                backgroundColor: "white",
                fontSize: 14,
                cursor:
                  !selectedSemester || !selectedYear
                    ? "not-allowed"
                    : "pointer",
                opacity: !selectedSemester || !selectedYear ? 0.6 : 1,
                transition: "all 0.2s ease",
              }}
              disabled={!selectedSemester || !selectedYear}
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {data && (
            <div>
              <button
                onClick={downloadPDF}
                style={{
                  padding: "8px 20px",
                  background: "#1e40af",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: 14,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#1e3a8a";
                  e.target.style.transform = "translateY(-1px)";
                  e.target.style.boxShadow = "0 4px 6px -1px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#1e40af";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              background: "#fee2e2",
              color: "#dc2626",
              fontSize: 14,
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Report Content */}
      {data && (
        <div
          style={{
            background: "white",
            padding: 24,
            borderRadius: 12,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb",
          }}
        >
          <div ref={reportRef}>
            <div dangerouslySetInnerHTML={{ __html: buildPDFHTML(data) }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAttainment;
