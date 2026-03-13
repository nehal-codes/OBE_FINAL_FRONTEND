// src/components/faculty/performance/CLOAnalysisSection.jsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import "./StudentPerformanceAnalysis.css";
const CLOCard = ({ clo, calculateAttainmentLevel }) => {
  const [expanded, setExpanded] = useState(false);

  const studentList = Array.isArray(clo.studentScores)
    ? clo.studentScores
    : Object.values(clo.studentScores || {});

  return (
    <div className="clo-card">
      <div className="clo-card-header" onClick={() => setExpanded(prev => !prev)}>
        <div className="clo-title">
          <strong>{clo.code}</strong>
          <span className="clo-statement">
            {clo.statement?.substring(0, 100)}{clo.statement?.length > 100 ? '…' : ''}
          </span>
        </div>
        <div className="clo-stats">
          <span className={`attainment-level level-${clo.directAttainment.level}`}>
            Level {clo.directAttainment.level} ({clo.directAttainment.label})
          </span>
          {expanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>

      {expanded && (
        <div className="clo-card-details">
          {/* Student-wise table */}
          <div className="example-table">
            <h4>Student-wise Attainment for {clo.code}</h4>
            <table className="attainment-table">
              <thead>
                <tr>
                  <th>Roll Number</th><th>Marks Scored</th><th>Max Marks</th>
                  <th>Percentage</th><th>Attained</th><th>Level</th>
                </tr>
              </thead>
              <tbody>
                {studentList.slice(0, 5).map(s => (
                  <tr key={s.studentId}>
                    <td>{s.rollNumber}</td>
                    <td>{(s.totalObtained ?? s.obtained ?? 0).toFixed(1)}</td>
                    <td>{s.totalMax ?? s.maxMarks ?? 0}</td>
                    <td>{(s.averagePercentage ?? s.percentage ?? 0).toFixed(1)}%</td>
                    <td>
                      <span className={(s.overallAttained ?? s.attained) ? 'attained-badge' : 'not-attained-badge'}>
                        {(s.overallAttained ?? s.attained) ? 'Attained' : 'Not Attained'}
                      </span>
                    </td>
                    <td>
                      <span className={`level-badge level-${s.overallAttainmentLevel ?? s.attainmentLevel ?? 0}`}>
                        {s.overallAttainmentLevel ?? s.attainmentLevel ?? 0}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {studentList.length > 5 && (
              <p className="more-students">… and {studentList.length - 5} more students</p>
            )}
          </div>

          {/* Class attainment calculator */}
          <div className="class-attainment">
            <h4>Class Attainment</h4>
            <div className="attainment-calculator">
              <p>Class Attainment = No. of Students Attained / Total × 100</p>
              <div className="calculation">
                <span className="formula">
                  {clo.statistics.attainedStudents} / {clo.statistics.totalStudents} × 100 =
                </span>
                <span className="result">{clo.statistics.classAttainment.toFixed(1)}%</span>
              </div>
            </div>

            <div className="direct-attainment">
              <h4>Direct Attainment (80% weight)</h4>
              <table className="attainment-levels-table">
                <thead><tr><th>Class Attainment %</th><th>Direct Level</th></tr></thead>
                <tbody>
                  <tr className={clo.statistics.classAttainment >= 60 ? 'highlight' : ''}>
                    <td>≥ 60%</td><td>Level 3 (High)</td>
                  </tr>
                  <tr className={clo.statistics.classAttainment >= 50 && clo.statistics.classAttainment < 60 ? 'highlight' : ''}>
                    <td>50%–59%</td><td>Level 2 (Medium)</td>
                  </tr>
                  <tr className={clo.statistics.classAttainment >= 40 && clo.statistics.classAttainment < 50 ? 'highlight' : ''}>
                    <td>40%–49%</td><td>Level 1 (Low)</td>
                  </tr>
                  <tr className={clo.statistics.classAttainment < 40 ? 'highlight' : ''}>
                    <td>&lt; 40%</td><td>Level 0 (Not Attained)</td>
                  </tr>
                </tbody>
              </table>
              <div className="attainment-result">
                <strong>Result:</strong> {clo.statistics.classAttainment.toFixed(1)}% →
                <span className={`level-indicator level-${clo.directAttainment.level}`}>
                  Level {clo.directAttainment.level} ({clo.directAttainment.label})
                </span>
              </div>
            </div>
          </div>

          {/* Distribution bars */}
          <div className="attainment-distribution">
            <h4>Attainment Level Distribution</h4>
            <div className="distribution-bars">
              {[3, 2, 1, 0].map(lvl => {
                const count = clo.statistics.attainmentDistribution[`level${lvl}`];
                const pct = clo.statistics.totalStudents > 0
                  ? (count / clo.statistics.totalStudents) * 100 : 0;
                return (
                  <div key={lvl} className="distribution-item">
                    <span className="level-label">Level {lvl}</span>
                    <div className="bar-container">
                      <div className={`bar-fill level-${lvl}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="bar-value">{count} students</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CLOAnalysisSection = ({ cloList, calculateAttainmentLevel }) => (
  <div className="clo-wise-analysis">
    {cloList.map(clo => (
      <CLOCard key={clo.id} clo={clo} calculateAttainmentLevel={calculateAttainmentLevel} />
    ))}
  </div>
);

export default CLOAnalysisSection;