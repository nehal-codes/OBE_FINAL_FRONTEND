// src/components/faculty/performance/AttainmentSummary.jsx
import React from 'react';
import "./StudentPerformanceAnalysis.css";
const AttainmentSummary = ({ cloList }) => (
  <div className="attainment-summary">
    <table className="attainment-summary-table">
      <thead>
        <tr>
          <th>CLO Code</th>
          <th>Bloom's Level</th>
          <th>Threshold</th>
          <th>Students Attained</th>
          <th>Class Attainment %</th>
          <th>Direct Attainment Level</th>
        </tr>
      </thead>
      <tbody>
        {cloList.map(clo => (
          <tr key={clo.id}>
            <td><strong>{clo.code}</strong></td>
            <td>{clo.bloomLevel || 'N/A'}</td>
            <td>{clo.threshold}%</td>
            <td>{clo.statistics.attainedStudents}/{clo.statistics.totalStudents}</td>
            <td>{clo.statistics.classAttainment.toFixed(1)}%</td>
            <td>
              <span className={`level-badge level-${clo.directAttainment.level}`}>
                Level {clo.directAttainment.level} ({clo.directAttainment.label})
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="summary-chart">
      <h4>CLO Attainment Levels</h4>
      <div className="chart-bars">
        {cloList.map(clo => (
          <div key={clo.id} className="chart-bar-item">
            <span className="clo-code">{clo.code}</span>
            <div className="bar-wrapper">
              <div
                className={`attainment-bar level-${clo.directAttainment.level}`}
                style={{ width: `${clo.statistics.classAttainment}%` }}
              >
                <span className="bar-percentage">{clo.statistics.classAttainment.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default AttainmentSummary;