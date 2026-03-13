import React from 'react';
import { Award, BarChart } from 'lucide-react';

const OverviewTab = ({ course, clos, stats, assessments, onAnalyzeAll }) => {
  const safeAssessments = Array.isArray(assessments) ? assessments : [];
  const finalizedCount = safeAssessments.filter(a => a.isMarksFinalized).length;

  return (
    <div className="overview-tab">
      <div className="summary-cards">
        <div className="summary-card">
          <h4>Course CLOs</h4>
          <div className="summary-value">{clos.length}</div>
          <div className="summary-subtext">All mapped to POs/PSOs</div>
        </div>

        <div className="summary-card">
          <h4>Assessments Created</h4>
          <div className="summary-value">{stats.assessmentsCount}</div>
          <div className="summary-subtext">Total assessments</div>
        </div>

        <div className="summary-card">
          <h4>Marks Allocation</h4>
          <div className="summary-value">{stats.marksPercentage}%</div>
          <div className="summary-subtext">
            {stats.marksUsed} of {stats.maxMarks} marks used
          </div>
        </div>

        <div className="summary-card analysis-card">
          <h4>Performance Analysis</h4>
          <div className="summary-value">{finalizedCount}</div>
          <div className="summary-subtext">Assessments finalized</div>
          {finalizedCount > 0 && (
            <button 
              className="btn-analyze"
              onClick={onAnalyzeAll}
            >
              <BarChart size={14} /> Analyze All
            </button>
          )}
        </div>
      </div>

      <div className="clos-section">
        <h3>Course CLOs</h3>
        {clos.length === 0 ? (
          <div className="no-clos">
            <Award size={48} />
            <p>No CLOs defined for this course</p>
          </div>
        ) : (
          <div className="clos-table">
            <table>
              <thead>
                <tr>
                  <th>CLO Code</th>
                  <th>Statement</th>
                  <th>Bloom Level</th>
                  <th>Threshold</th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo, index) => (
                  <tr key={clo.id || index}>
                    <td><strong>{clo.code}</strong></td>
                    <td>{clo.statement || "No description"}</td>
                    <td>
                      <span className={`bloom-level ${(clo.bloomLevel || "").toLowerCase()}`}>
                        {clo.bloomLevel || "N/A"}
                      </span>
                    </td>
                    <td>{clo.attainmentThreshold || 50}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;