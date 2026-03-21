// src/components/faculty/performance/AssessmentDetails.jsx
import React from 'react';
import "./StudentPerformanceAnalysis.css";

const ScoreDistributionBars = ({ students }) => {
  const ranges = [
    { label: '0–20%', min: 0, max: 20, color: '#93c5fd' },
    { label: '21–40%', min: 21, max: 40, color: '#60a5fa' },
    { label: '41–60%', min: 41, max: 60, color: '#3b82f6' },
    { label: '61–80%', min: 61, max: 80, color: '#2563eb' },
    { label: '81–100%', min: 81, max: 100, color: '#1e40af' },
  ];

  return (
    <div className="performance-distribution">
      <h4>Score Distribution</h4>
      <div className="distribution-bars">
        {ranges.map(({ label, min, max, color }) => {
          const count = students.filter(s => s.totalPercentage >= min && s.totalPercentage <= max).length;
          const pct = students.length > 0 ? (count / students.length) * 100 : 0;
          return (
            <div key={label} className="distribution-item">
              <span className="level-label">{label}</span>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="bar-value">{count} students ({pct.toFixed(0)}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SingleAssessmentDetails = ({ performanceData }) => (
  <div className="single-assessment-details">
    <div className="details-grid">
      <div className="detail-card">
        <h4>Assessment Information</h4>
        <table className="details-table">
          <tbody>
            <tr><td>Title:</td><td><strong>{performanceData.assessment?.title}</strong></td></tr>
            <tr><td>Type:</td><td>{performanceData.assessment?.type || 'N/A'}</td></tr>
            <tr><td>Total Marks:</td><td>{performanceData.assessment?.maxMarks}</td></tr>
            {performanceData.assessment?.duration && (
              <tr><td>Duration:</td><td>{performanceData.assessment.duration} minutes</td></tr>
            )}
            {performanceData.assessment?.conductedOn && (
              <tr><td>Conducted On:</td><td>{new Date(performanceData.assessment.conductedOn).toLocaleDateString()}</td></tr>
            )}
            <tr><td>Status:</td><td><span className="finalized-tag">✓ Finalized</span></td></tr>
          </tbody>
        </table>
      </div>

      <div className="detail-card">
        <h4>CLO-wise Marks Distribution</h4>
        <table className="marks-distribution-table">
          <thead>
            <tr><th>CLO</th><th>Bloom's Level</th><th>Max Marks</th><th>Weightage</th></tr>
          </thead>
          <tbody>
            {performanceData.clos?.map(clo => (
              <tr key={clo.id}>
                <td><strong>{clo.code}</strong></td>
                <td>{clo.bloomLevel || 'N/A'}</td>
                <td>{clo.maxMarks}</td>
                <td>
                  {performanceData.assessment?.maxMarks > 0
                    ? ((clo.maxMarks / performanceData.assessment.maxMarks) * 100).toFixed(1)
                    : 0}%
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="2"><strong>Total</strong></td>
              <td><strong>{performanceData.assessment?.maxMarks}</strong></td>
              <td><strong>100%</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <ScoreDistributionBars students={performanceData.students} />
  </div>
);

const AllAssessmentsDetails = ({ performanceData }) => (
  <div className="all-assessments-details">
    <h4>Assessments Included in Analysis</h4>
    <div className="assessments-grid">
      {performanceData.assessmentWiseStats?.map((stat, i) => (
        <div key={i} className="assessment-summary-card">
          <div className="assessment-card-header">
            <h5>{stat.assessment.title}</h5>
            <span className="assessment-type">{stat.assessment.type || 'Assessment'}</span>
          </div>
          <div className="assessment-card-stats">
            <div className="stat-row"><span className="stat-label">Max Marks:</span><span className="stat-value">{stat.assessment.maxMarks}</span></div>
            <div className="stat-row"><span className="stat-label">CLOs Covered:</span><span className="stat-value">{stat.clos.length}</span></div>
          </div>
          <div className="assessment-clos">
            <small>CLOs: {stat.clos.map(c => c.code).join(', ')}</small>
          </div>
        </div>
      ))}
    </div>

    <div className="clo-coverage-matrix">
      <h4>CLO Coverage Across Assessments</h4>
      <table className="coverage-matrix-table">
        <thead>
          <tr>
            <th>CLO</th>
            {performanceData.assessments?.map(a => (
              <th key={a.id} title={a.title}>
                {a.title.length > 15 ? a.title.substring(0, 12) + '…' : a.title}
              </th>
            ))}
            <th>Coverage</th>
          </tr>
        </thead>
        <tbody>
          {performanceData.clos?.map(clo => {
            const cnt = performanceData.assessmentWiseStats?.filter(
              s => s.clos.some(c => c.id === clo.id)
            ).length || 0;
            return (
              <tr key={clo.id}>
                <td><strong>{clo.code}</strong></td>
                {performanceData.assessments?.map(a => {
                  const covered = performanceData.assessmentWiseStats?.some(
                    s => s.assessment.id === a.id && s.clos.some(c => c.id === clo.id)
                  );
                  return (
                    <td key={a.id} className={covered ? 'covered' : 'not-covered'}>
                      <span className="coverage-indicator">{covered ? '✓' : '✗'}</span>
                    </td>
                  );
                })}
                <td className="coverage-count">
                  <span className={`coverage-badge ${cnt === performanceData.assessments?.length ? 'full' : 'partial'}`}>
                    {cnt}/{performanceData.assessments?.length}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

const AssessmentDetails = ({ isAllMode, performanceData }) => {
  if (!isAllMode) return <SingleAssessmentDetails performanceData={performanceData} />;
  return <AllAssessmentsDetails performanceData={performanceData} />;
};

export default AssessmentDetails;